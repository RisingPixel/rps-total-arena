import { Entity, EntityType } from '../types';

export const checkCollision = (
  e1: Entity, 
  e2: Entity, 
  entitySize: number
): boolean => {
  const dx = e1.x - e2.x;
  const dy = e1.y - e2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const radius1 = (entitySize * e1.scale) / 2;
  const radius2 = (entitySize * e2.scale) / 2;
  const collisionThreshold = radius1 + radius2;
  
  return distance < collisionThreshold;
};

export const determineWinner = (
  type1: EntityType, 
  type2: EntityType
): EntityType => {
  if (type1 === type2) return type1;
  if (type1 === "rock" && type2 === "scissors") return "rock";
  if (type1 === "scissors" && type2 === "paper") return "scissors";
  if (type1 === "paper" && type2 === "rock") return "paper";
  return type2;
};

export const bounceOffWalls = (
  entity: Entity,
  canvasWidth: number,
  canvasHeight: number,
  entitySize: number
) => {
  if (entity.x <= 0 || entity.x >= canvasWidth - entitySize) {
    entity.vx *= -1;
    entity.x = Math.max(0, Math.min(entity.x, canvasWidth - entitySize));
  }
  if (entity.y <= 0 || entity.y >= canvasHeight - entitySize) {
    entity.vy *= -1;
    entity.y = Math.max(0, Math.min(entity.y, canvasHeight - entitySize));
  }
};

export const applyBoostToEntity = (entity: Entity, now: number, config: {
  clickCooldown: number;
  boostDuration: number;
  boostSpeedMult: number;
}): boolean => {
  if (now - entity.lastClickTime < config.clickCooldown) {
    return false;
  }
  
  entity.isBoosted = true;
  entity.boostEndTime = now + config.boostDuration;
  entity.boostMultiplier = config.boostSpeedMult;
  entity.lastClickTime = now;
  
  const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
  const newSpeed = currentSpeed * config.boostSpeedMult;
  const angle = Math.atan2(entity.vy, entity.vx);
  entity.vx = Math.cos(angle) * newSpeed;
  entity.vy = Math.sin(angle) * newSpeed;
  
  return true;
};

export const resetBoost = (entity: Entity, boostRevertMult: number) => {
  entity.isBoosted = false;
  entity.boostMultiplier = 1.0;
  
  const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
  const normalSpeed = currentSpeed * boostRevertMult;
  const angle = Math.atan2(entity.vy, entity.vx);
  entity.vx = Math.cos(angle) * normalSpeed;
  entity.vy = Math.sin(angle) * normalSpeed;
};
