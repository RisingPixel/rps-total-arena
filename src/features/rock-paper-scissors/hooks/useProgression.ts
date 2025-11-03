import { useState, useEffect, useCallback } from 'react';
import { PlayerStats, Achievement } from '../types/progression';
import { ACHIEVEMENTS_CONFIG } from '../constants/achievements';

const STORAGE_KEY_STATS = 'rps_player_stats';
const STORAGE_KEY_ACHIEVEMENTS = 'rps_achievements';

const DEFAULT_STATS: PlayerStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  totalCoins: 0,
  totalCollisions: 0,
  totalCombos: 0,
  bestStreak: 0,
  fastestWin: Infinity,
};

export const useProgression = () => {
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STATS);
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Initialize achievements from config
    return ACHIEVEMENTS_CONFIG.map(config => ({
      ...config,
      unlocked: false,
      progress: 0,
    }));
  });

  const [recentCoins, setRecentCoins] = useState<number | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achievements));
  }, [achievements]);

  const addCoins = useCallback((amount: number, reason: string) => {
    setStats(prev => ({
      ...prev,
      totalCoins: prev.totalCoins + amount,
    }));
    
    setRecentCoins(amount);
    setTimeout(() => setRecentCoins(null), 2000);
  }, []);

  const checkAchievements = useCallback((
    currentStreak: number,
    maxCombo: number,
    battleDuration: number,
    totalCollisions: number,
    won: boolean
  ) => {
    const unlocked: Achievement[] = [];

    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.unlocked) return achievement;

        let currentProgress = achievement.progress;
        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first_win':
            currentProgress = stats.wins + (won ? 1 : 0);
            shouldUnlock = currentProgress >= 1 && won;
            break;
          
          case 'lucky_streak':
            currentProgress = currentStreak;
            shouldUnlock = currentStreak >= 3;
            break;
          
          case 'streak_master':
            currentProgress = currentStreak;
            shouldUnlock = currentStreak >= 5;
            break;
          
          case 'unbeatable':
            currentProgress = currentStreak;
            shouldUnlock = currentStreak >= 10;
            break;
          
          case 'brawler':
            currentProgress = stats.totalCollisions + totalCollisions;
            shouldUnlock = currentProgress >= 100;
            break;
          
          case 'warmonger':
            currentProgress = stats.totalCollisions + totalCollisions;
            shouldUnlock = currentProgress >= 500;
            break;
          
          case 'combo_starter':
            currentProgress = Math.max(maxCombo, achievement.progress);
            shouldUnlock = maxCombo >= 5;
            break;
          
          case 'combo_master':
            currentProgress = Math.max(maxCombo, achievement.progress);
            shouldUnlock = maxCombo >= 10;
            break;
          
          case 'speedrunner':
            if (won && battleDuration < stats.fastestWin) {
              currentProgress = 10 - battleDuration;
              shouldUnlock = battleDuration <= 10;
            }
            break;
          
          case 'veteran':
            currentProgress = stats.totalGames + 1;
            shouldUnlock = currentProgress >= 10;
            break;
          
          case 'arena_legend':
            currentProgress = stats.totalGames + 1;
            shouldUnlock = currentProgress >= 50;
            break;
          
          case 'coin_collector':
            currentProgress = stats.totalCoins;
            shouldUnlock = stats.totalCoins >= 500;
            break;
          
          case 'millionaire':
            currentProgress = stats.totalCoins;
            shouldUnlock = stats.totalCoins >= 1000;
            break;
          
          case 'comeback_king':
            if (won && stats.wins > 0 && currentStreak === 1) {
              currentProgress = 1;
              shouldUnlock = true;
            }
            break;
          
          case 'perfect_prediction':
            currentProgress = stats.wins;
            shouldUnlock = stats.wins >= 5;
            break;
        }

        if (shouldUnlock && !achievement.unlocked) {
          const unlockedAchievement = {
            ...achievement,
            unlocked: true,
            progress: achievement.requirement,
          };
          unlocked.push(unlockedAchievement);
          return unlockedAchievement;
        }

        return {
          ...achievement,
          progress: currentProgress,
        };
      });

      return updated;
    });

    // Add coin rewards for unlocked achievements
    unlocked.forEach(achievement => {
      addCoins(achievement.coinReward, `Achievement: ${achievement.name}`);
    });

    // Show achievement toasts
    if (unlocked.length > 0) {
      setNewAchievements(unlocked);
      setTimeout(() => setNewAchievements([]), 5000);
    }

    return unlocked;
  }, [stats, addCoins]);

  const recordGameResult = useCallback((
    won: boolean,
    currentStreak: number,
    maxCombo: number,
    battleDuration: number,
    collisions: number,
    speed: number
  ) => {
    // Calculate coin earnings
    let coinsEarned = 0;

    if (won) {
      // Base win reward
      coinsEarned = 10;
      
      // Combo bonus (1 coin per combo point above 3)
      if (maxCombo >= 3) {
        coinsEarned += (maxCombo - 2);
      }
      
      // Speed bonus (faster = more coins)
      if (speed >= 3) {
        coinsEarned += Math.floor(speed);
      }
      
      // Streak multiplier
      if (currentStreak >= 3) {
        coinsEarned = Math.floor(coinsEarned * (1 + (currentStreak - 2) * 0.2));
      }
    } else {
      // Participation reward
      coinsEarned = 2;
      
      // Combo effort reward
      if (maxCombo >= 3) {
        coinsEarned += Math.floor(maxCombo / 2);
      }
    }

    // Update stats
    setStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1,
      wins: won ? prev.wins + 1 : prev.wins,
      losses: won ? prev.losses : prev.losses + 1,
      totalCoins: prev.totalCoins + coinsEarned,
      totalCollisions: prev.totalCollisions + collisions,
      totalCombos: prev.totalCombos + (maxCombo >= 3 ? 1 : 0),
      bestStreak: Math.max(prev.bestStreak, currentStreak),
      fastestWin: won && battleDuration < prev.fastestWin ? battleDuration : prev.fastestWin,
    }));

    addCoins(coinsEarned, won ? 'Victory!' : 'Battle Complete');

    // Check for achievements
    checkAchievements(currentStreak, maxCombo, battleDuration, collisions, won);
  }, [addCoins, checkAchievements]);

  const dismissAchievement = useCallback((id: string) => {
    setNewAchievements(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    stats,
    achievements,
    recentCoins,
    newAchievements,
    recordGameResult,
    dismissAchievement,
  };
};
