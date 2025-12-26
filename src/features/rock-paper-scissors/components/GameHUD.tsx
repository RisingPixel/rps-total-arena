import totalArenaLogo from "@/assets/total-arena-logo.png";
import { EntityType } from "../types";
import { EMOJI_MAP } from "../constants";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";

interface GameHUDProps {
  counts: { rock: number; paper: number; scissors: number };
  streak: number;
  currentCombo: number;
  playerBet: EntityType | null;
  gamePhase: string;
}

export const GameHUD = ({ counts, streak, currentCombo, playerBet, gamePhase }: GameHUDProps) => {
  const animatedRockCount = useAnimatedCounter(counts.rock);
  const animatedPaperCount = useAnimatedCounter(counts.paper);
  const animatedScissorsCount = useAnimatedCounter(counts.scissors);
  
  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* Ultra-Compact HUD */}
      <div id="hudCompact" className="hud-compact-container">
        {/* Top Row: Title + Win Streak */}
        <div className="top-row">
          <img 
            src={totalArenaLogo} 
            alt="Total Arena" 
            className="game-title-logo h-24 md:h-8 w-auto mx-auto"
          />
          {streak > 0 && (
            <div id="streakChip" className="streak-chip">
              🔥 {streak} win streak
            </div>
          )}
        </div>
        
        {/* Progress Bar Container */}
        <div className="arena-bar-wrapper">
          {/* Bet Pill Floating */}
          <div 
            id="betPill" 
            className="bet-pill-floating"
            data-bet-type={playerBet || undefined}
          >
            Your bet: {playerBet && EMOJI_MAP[playerBet]}
          </div>
          
          {/* Progress Bar */}
          <div id="arenaBar" className="arena-bar">
            <span 
              className={`bar rock ${playerBet === 'rock' ? 'bet-active' : ''} ${counts.rock > counts.paper && counts.rock > counts.scissors ? 'leader' : ''}`}
              style={{ width: `${(counts.rock / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
            >
              <span className="segment-content">
                <span className="segment-emoji">🪨</span>
                <span className="segment-value">{animatedRockCount}</span>
              </span>
            </span>
            
            <span 
              className={`bar paper ${playerBet === 'paper' ? 'bet-active' : ''} ${counts.paper > counts.rock && counts.paper > counts.scissors ? 'leader' : ''}`}
              style={{ width: `${(counts.paper / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
            >
              <span className="segment-content">
                <span className="segment-emoji">📜</span>
                <span className="segment-value">{animatedPaperCount}</span>
              </span>
            </span>
            
            <span 
              className={`bar scissors ${playerBet === 'scissors' ? 'bet-active' : ''} ${counts.scissors > counts.rock && counts.scissors > counts.paper ? 'leader' : ''}`}
              style={{ width: `${(counts.scissors / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
            >
              <span className="segment-content">
                <span className="segment-emoji">✂️</span>
                <span className="segment-value">{animatedScissorsCount}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Combo Badge - Fixed Overlay */}
      {currentCombo >= 3 && gamePhase === 'running' && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce">
          <div 
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-full font-bold text-lg sm:text-2xl shadow-2xl transition-all duration-300 whitespace-nowrap"
            style={{
              background: currentCombo >= 10 
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
                : currentCombo >= 7
                ? 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'
                : 'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
              transform: `scale(${Math.min(1 + currentCombo * 0.03, 1.5)})`,
              animation: currentCombo >= 10 ? 'pulse 0.5s infinite' : 'none'
            }}
          >
            <span className="text-white drop-shadow-lg">
              x{currentCombo} COMBO! 🔥
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
