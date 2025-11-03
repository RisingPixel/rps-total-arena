import { Button } from "@/components/ui/button";
import { BattleStats, EntityType } from "../types";
import { EMOJI_MAP } from "../constants";

interface VictoryScreenProps {
  winner: EntityType;
  playerBet: EntityType | null;
  streak: number;
  maxCombo: number;
  battleStats: BattleStats;
  showConfetti: boolean;
  coinsEarned: number;
  onPlayAgain: () => void;
  onShowStats?: () => void;
  onShowAchievements?: () => void;
}

export const VictoryScreen = ({ 
  winner, 
  playerBet, 
  streak, 
  maxCombo, 
  battleStats, 
  showConfetti,
  coinsEarned,
  onPlayAgain,
  onShowStats,
  onShowAchievements
}: VictoryScreenProps) => {
  return (
    <div 
      id="winnerOverlay" 
      className="winner-overlay"
      role="dialog"
      aria-labelledby="winnerTitle"
    >
      <div className="winner-content">
        {/* Confetti */}
        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ 
              length: window.innerHeight < 550 ? 30 : 50 
            }).map((_, i) => (
              <div 
                key={i}
                className="confetti-piece"
                style={{
                  '--x': `${Math.random() * 100}vw`,
                  '--duration': `${2 + Math.random() * 2}s`,
                  '--delay': `${Math.random() * 0.5}s`,
                } as React.CSSProperties}
              >
                {EMOJI_MAP[winner]}
              </div>
            ))}
          </div>
        )}
        
        <div 
          id="winnerEmoji" 
          className="winner-emoji-burst"
          data-emoji={EMOJI_MAP[winner]}
        >
          {EMOJI_MAP[winner]}
        </div>
        
        <h2 id="winnerTitle" className="winner-title">
          {winner === playerBet 
            ? "Victory! 🎉" 
            : "Defeat 😔"}
        </h2>
        
        <p className="dominance-text">
          Total domination achieved
        </p>
        
        {/* Coins Earned */}
        <div className="flex items-center justify-center gap-2 text-primary font-mono text-lg mb-4 animate-fade-in">
          <span>💰</span>
          <span>+{coinsEarned} Coins</span>
        </div>
        
        {/* Stats Recap */}
        <div className="stats-recap">
          <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.2s' }}>
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{battleStats.duration}s</span>
            <span className="stat-label">Battle Duration</span>
          </div>
          
          <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.4s' }}>
            <span className="stat-icon">💥</span>
            <span className="stat-value">{battleStats.totalCollisions}</span>
            <span className="stat-label">Collisions</span>
          </div>
          
          {maxCombo >= 3 && (
            <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.6s' }}>
              <span className="stat-icon">🔥</span>
              <span className="stat-value">x{maxCombo}</span>
              <span className="stat-label">Max Combo</span>
            </div>
          )}
        </div>
        
        {winner === playerBet && streak > 0 && (
          <div 
            id="streakCount" 
            className="streak-display"
            aria-live="polite"
          >
            <span className="streak-emoji">🔥</span>
            <span className="streak-number">{streak}</span>
            <span className="streak-label">
              win streak
            </span>
          </div>
        )}
        
        <div className="victory-actions">
          {onShowStats && (
            <Button 
              onClick={onShowStats}
              size="lg"
              className="font-mono"
            >
              📊 Stats
            </Button>
          )}
          
          {onShowAchievements && (
            <Button 
              onClick={onShowAchievements}
              size="lg"
              className="font-mono"
            >
              🏅 Achievements
            </Button>
          )}
          
          <Button 
            id="playAgainBtn"
            onClick={onPlayAgain}
            size="lg"
            className="font-mono"
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};
