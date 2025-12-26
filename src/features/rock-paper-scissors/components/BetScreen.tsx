import { Card } from "@/components/ui/card";
import totalArenaLogo from "@/assets/total-arena-logo.png";
import { BetConfettiParticle, EntityType } from "../types";
import { EMOJI_MAP } from "../constants";

interface BetScreenProps {
  onBet: (type: EntityType) => void;
  bettingTimeLeft: number;
  streak: number;
  betConfetti: BetConfettiParticle[];
}

export const BetScreen = ({ onBet, bettingTimeLeft, streak, betConfetti }: BetScreenProps) => {
  return (
    <div id="betScreen" className="w-full max-h-full flex flex-col items-center gap-2 sm:gap-3 overflow-hidden">
      <div className="flex-shrink-0 text-center">
        <img 
          src={totalArenaLogo} 
          alt="Total Arena - Rock Paper Scissors" 
          className="mx-auto h-[10vh] md:h-[12vh] max-h-24 w-auto drop-shadow-lg"
        />
      </div>
      
      <Card className="w-full max-w-4xl mx-auto p-3 sm:p-6 shadow-lg relative">
        {/* Betting Timer Bar */}
        <div className="betting-timer-bar" style={{ 
          width: `${(bettingTimeLeft / 15) * 100}%` 
        }} />
        
        {/* Timer Text */}
        <div className="text-center mb-4">
          <span className={`betting-timer-text ${bettingTimeLeft <= 5 ? 'urgent' : ''}`}>
            Choose your fighter: {bettingTimeLeft}s
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            data-bet="rock"
            onClick={() => onBet('rock')}
            className="bet-card group"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-4 block group-hover:scale-110 transition-transform">
              🪨
            </span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono">Rock</span>
          </button>
          
          <button
            data-bet="paper"
            onClick={() => onBet('paper')}
            className="bet-card group"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-4 block group-hover:scale-110 transition-transform">
              📜
            </span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono">Paper</span>
          </button>
          
          <button
            data-bet="scissors"
            onClick={() => onBet('scissors')}
            className="bet-card group"
          >
            <span className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-4 block group-hover:scale-110 transition-transform">
              ✂️
            </span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono">Scissors</span>
          </button>
        </div>
      </Card>
      
      {/* Mini Confetti on Bet Click */}
      {betConfetti.map((particle, index) => (
        <div
          key={particle.id}
          className="bet-confetti-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            '--angle': `${(index / 8) * 360}deg`,
            '--distance': '80px'
          } as React.CSSProperties}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  );
};
