import totalArenaLogo from "@/assets/total-arena-logo.png";
import { EntityType } from "../types";
import { EMOJI_MAP } from "../constants";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";

interface GameHUDProps {
  counts: { rock: number; paper: number; scissors: number };
  streak: number;
  playerBet: EntityType | null;
}

export const GameHUD = ({ counts, streak, playerBet }: GameHUDProps) => {
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
    </div>
  );
};
