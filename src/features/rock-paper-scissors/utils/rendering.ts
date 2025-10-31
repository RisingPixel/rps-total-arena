import { Entity } from '../types';
import { EMOJI_MAP } from '../constants';

export const renderEntity = (
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  entitySize: number,
  fontSizeEmoji: number
) => {
  ctx.save();
  ctx.translate(entity.x + entitySize / 2, entity.y + entitySize / 2);
  
  // Boost trail
  if (entity.isBoosted && Date.now() < entity.boostEndTime) {
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, entitySize * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
  
  ctx.scale(entity.scale, entity.scale);
  ctx.font = `${fontSizeEmoji}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(EMOJI_MAP[entity.type], 0, 0);
  ctx.restore();
};

export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isSlowMotion: boolean
) => {
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  
  if (isSlowMotion) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
};
