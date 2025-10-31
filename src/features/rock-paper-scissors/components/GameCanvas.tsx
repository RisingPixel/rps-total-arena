import { forwardRef } from "react";
import { TouchParticle } from "../types";

interface GameCanvasProps {
  arenaSize: number;
  touchParticles: TouchParticle[];
  onRemoveParticle: (id: number) => void;
  wrapperRef: React.RefObject<HTMLDivElement>;
}

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(
  ({ arenaSize, touchParticles, onRemoveParticle, wrapperRef }, ref) => {
    return (
      <div ref={wrapperRef} className="canvas-wrapper relative">
        <canvas
          id="canvas"
          ref={ref}
          width={arenaSize}
          height={arenaSize}
          className="border-4 border-border rounded-lg shadow-lg bg-slate-50 max-w-full"
        />
        
        {/* Touch Particles */}
        {touchParticles.map(particle => (
          <div
            key={particle.id}
            className={`touch-particle ${particle.type || ''}`}
            style={{
              left: particle.x,
              top: particle.y,
            }}
            onAnimationEnd={() => onRemoveParticle(particle.id)}
          />
        ))}
      </div>
    );
  }
);

GameCanvas.displayName = "GameCanvas";
