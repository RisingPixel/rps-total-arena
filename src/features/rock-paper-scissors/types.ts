export type EntityType = "rock" | "paper" | "scissors";
export type GamePhase = "bet" | "running" | "victory";

export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EntityType;
  size: number;
  scale: number;
  targetScale: number;
  scaleSpeed: number;
  isBoosted: boolean;
  boostEndTime: number;
  boostMultiplier: number;
  lastClickTime: number;
}

export interface TouchParticle {
  id: number;
  x: number;
  y: number;
  timestamp: number;
  type?: 'boost' | 'combo';
  comboLevel?: number;
}

export interface BattleStats {
  startTime: number;
  totalCollisions: number;
  duration: number;
}

export interface BetConfettiParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}
