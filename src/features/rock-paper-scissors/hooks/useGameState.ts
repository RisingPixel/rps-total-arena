import { useEffect, useRef, useState } from "react";
import { BattleStats, BetConfettiParticle, EntityType, GamePhase, TouchParticle } from "../types";
import { GAME_CONFIG } from "../constants";

export const useGameState = () => {
  // Game phase
  const [gamePhase, setGamePhase] = useState<GamePhase>("bet");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<EntityType | null>(null);
  
  // Betting
  const [playerBet, setPlayerBet] = useState<EntityType | null>(null);
  const [streak, setStreak] = useState(0);
  const [bettingTimeLeft, setBettingTimeLeft] = useState<number>(GAME_CONFIG.BETTING_TIME);
  const [betConfetti, setBetConfetti] = useState<BetConfettiParticle[]>([]);
  
  // Configuration
  const [rockCount, setRockCount] = useState(20);
  const [paperCount, setPaperCount] = useState(20);
  const [scissorsCount, setScissorsCount] = useState(20);
  const [speed, setSpeed] = useState(2);
  const [arenaSize, setArenaSize] = useState(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let reservedSpace: number;
    if (height < 500) {
      reservedSpace = GAME_CONFIG.RESERVED_SPACE_LANDSCAPE;
    } else if (width < GAME_CONFIG.MOBILE_MAX_WIDTH) {
      reservedSpace = GAME_CONFIG.RESERVED_SPACE_MOBILE;
    } else if (width < GAME_CONFIG.TABLET_MAX_WIDTH) {
      reservedSpace = GAME_CONFIG.RESERVED_SPACE_TABLET;
    } else {
      reservedSpace = GAME_CONFIG.RESERVED_SPACE_DESKTOP;
    }
    
    const availableHeight = height - reservedSpace;
    const availableWidth = width - 32;
    const maxSize = Math.min(availableHeight, availableWidth);
    
    if (width < GAME_CONFIG.MOBILE_MAX_WIDTH) return Math.min(maxSize, GAME_CONFIG.MOBILE_MAX_ARENA);
    if (width < GAME_CONFIG.TABLET_MAX_WIDTH) return maxSize;
    return Math.min(maxSize, GAME_CONFIG.DESKTOP_MAX_ARENA);
  });
  
  // Live counters
  const [counts, setCounts] = useState({ rock: 0, paper: 0, scissors: 0 });
  const [prevCounts, setPrevCounts] = useState({ rock: 0, paper: 0, scissors: 0 });
  const [prevLeader, setPrevLeader] = useState<EntityType | null>(null);
  
  // Combo system
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastConversionType, setLastConversionType] = useState<EntityType | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Juiciness
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [touchParticles, setTouchParticles] = useState<TouchParticle[]>([]);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('rps_audio_muted');
    return saved === 'true';
  });
  
  // Stats
  const battleStatsRef = useRef<BattleStats>({
    startTime: 0,
    totalCollisions: 0,
    duration: 0
  });
  const [battleStatsFinal, setBattleStatsFinal] = useState<BattleStats>({
    startTime: 0,
    totalCollisions: 0,
    duration: 0
  });
  
  // Special refs
  const isSlowMotionRef = useRef(false);
  
  // Load streak from localStorage
  useEffect(() => {
    const savedStreak = localStorage.getItem('rps_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  }, []);
  
  // Betting timer countdown
  useEffect(() => {
    if (gamePhase === 'bet' && bettingTimeLeft > 0) {
      const timer = setInterval(() => {
        setBettingTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, bettingTimeLeft]);
  
  // Update streak
  const updateStreak = (won: boolean) => {
    const newStreak = won ? streak + 1 : 0;
    setStreak(newStreak);
    localStorage.setItem('rps_streak', newStreak.toString());
  };
  
  return {
    // Game phase
    gamePhase, setGamePhase,
    isRunning, setIsRunning,
    isPaused, setIsPaused,
    winner, setWinner,
    
    // Betting
    playerBet, setPlayerBet,
    streak, updateStreak,
    bettingTimeLeft, setBettingTimeLeft,
    betConfetti, setBetConfetti,
    
    // Configuration
    rockCount, setRockCount,
    paperCount, setPaperCount,
    scissorsCount, setScissorsCount,
    speed, setSpeed,
    arenaSize, setArenaSize,
    
    // Live counters
    counts, setCounts,
    prevCounts, setPrevCounts,
    prevLeader, setPrevLeader,
    
    // Combo
    currentCombo, setCurrentCombo,
    maxCombo, setMaxCombo,
    lastConversionType, setLastConversionType,
    comboTimeoutRef,
    
    // Juiciness
    countdown, setCountdown,
    showConfetti, setShowConfetti,
    touchParticles, setTouchParticles,
    isMuted, setIsMuted,
    
    // Stats
    battleStatsRef,
    battleStatsFinal, setBattleStatsFinal,
    isSlowMotionRef,
  };
};
