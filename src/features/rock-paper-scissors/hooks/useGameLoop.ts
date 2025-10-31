import { useCallback, useEffect, useRef } from "react";
import { Entity, EntityType } from "../types";
import { bounceOffWalls, checkCollision, determineWinner, resetBoost } from "../utils/physics";
import { clearCanvas, renderEntity } from "../utils/rendering";
import { handleEntityConversion } from "../utils/combo";
import { GAME_CONFIG } from "../constants";

interface UseGameLoopParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  entitiesRef: React.MutableRefObject<Entity[]>;
  gameState: any;
  pokiSDK: any;
  scaledParams: { entitySize: number; fontSizeEmoji: number };
}

export const useGameLoop = ({ canvasRef, entitiesRef, gameState, pokiSDK, scaledParams }: UseGameLoopParams) => {
  const animationFrameRef = useRef<number>();
  
  const animate = useCallback(() => {
    if (pokiSDK.isAdPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    
    if (!canvasRef.current || gameState.isPaused) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { entitySize, fontSizeEmoji } = scaledParams;
    const entities = entitiesRef.current;
    
    // Clear canvas
    clearCanvas(ctx, canvas.width, canvas.height, gameState.isSlowMotionRef.current);
    
    // Update scale interpolation
    entities.forEach((entity) => {
      if (entity.scale !== entity.targetScale) {
        entity.scale += (entity.targetScale - entity.scale) * entity.scaleSpeed;
        
        if (Math.abs(entity.scale - entity.targetScale) < 0.01) {
          entity.scale = entity.targetScale;
        }
      }
    });
    
    // Update positions
    entities.forEach((entity) => {
      entity.x += entity.vx;
      entity.y += entity.vy;
      
      bounceOffWalls(entity, canvas.width, canvas.height, entitySize);
    });
    
    // Check collisions and transform
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        if (checkCollision(entities[i], entities[j], entitySize)) {
          const winner = determineWinner(entities[i].type, entities[j].type);
          
          if (winner !== entities[i].type) {
            handleEntityConversion(
              entities[i],
              winner,
              {
                entitySize,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                arenaSize: gameState.arenaSize,
                currentCombo: gameState.currentCombo,
                lastConversionType: gameState.lastConversionType,
                comboTimeout: GAME_CONFIG.COMBO_TIMEOUT,
                comboParticleThreshold: GAME_CONFIG.COMBO_PARTICLE_THRESHOLD,
                maxComboParticles: GAME_CONFIG.MAX_COMBO_PARTICLES,
              },
              {
                incrementCollisions: () => gameState.battleStatsRef.current.totalCollisions++,
                setCurrentCombo: gameState.setCurrentCombo,
                setMaxCombo: gameState.setMaxCombo,
                setLastConversionType: gameState.setLastConversionType,
                setTouchParticles: gameState.setTouchParticles,
                comboTimeoutRef: gameState.comboTimeoutRef,
              }
            );
          }
          
          if (winner !== entities[j].type) {
            handleEntityConversion(
              entities[j],
              winner,
              {
                entitySize,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
                arenaSize: gameState.arenaSize,
                currentCombo: gameState.currentCombo,
                lastConversionType: gameState.lastConversionType,
                comboTimeout: GAME_CONFIG.COMBO_TIMEOUT,
                comboParticleThreshold: GAME_CONFIG.COMBO_PARTICLE_THRESHOLD,
                maxComboParticles: GAME_CONFIG.MAX_COMBO_PARTICLES,
              },
              {
                incrementCollisions: () => gameState.battleStatsRef.current.totalCollisions++,
                setCurrentCombo: gameState.setCurrentCombo,
                setMaxCombo: gameState.setMaxCombo,
                setLastConversionType: gameState.setLastConversionType,
                setTouchParticles: gameState.setTouchParticles,
                comboTimeoutRef: gameState.comboTimeoutRef,
              }
            );
          }
        }
      }
    }
    
    // Draw entities
    entities.forEach((entity) => {
      renderEntity(ctx, entity, entitySize, fontSizeEmoji);
      
      // Reset boost if expired
      if (entity.isBoosted && Date.now() >= entity.boostEndTime) {
        resetBoost(entity, GAME_CONFIG.BOOST_REVERT_MULT);
      }
    });
    
    // Update counts
    const newCounts = { rock: 0, paper: 0, scissors: 0 };
    entities.forEach((entity) => {
      newCounts[entity.type]++;
    });
    
    const countsChanged = 
      newCounts.rock !== gameState.counts.rock ||
      newCounts.paper !== gameState.counts.paper ||
      newCounts.scissors !== gameState.counts.scissors;
    
    if (countsChanged) {
      gameState.setPrevCounts(gameState.counts);
      gameState.setCounts(newCounts);
    }
    
    // Check for slow-motion trigger
    const typesWithEntities = Object.keys(newCounts).filter(
      (type) => newCounts[type as EntityType] > 0
    );
    
    if (typesWithEntities.length === 2 && !gameState.isSlowMotionRef.current) {
      const losingTypes = typesWithEntities.filter(
        (type) => newCounts[type as EntityType] < GAME_CONFIG.SLOW_MOTION_THRESHOLD
      );
      
      if (losingTypes.length > 0) {
        gameState.isSlowMotionRef.current = true;
        entitiesRef.current.forEach(entity => {
          entity.vx *= GAME_CONFIG.SLOW_MOTION_FACTOR;
          entity.vy *= GAME_CONFIG.SLOW_MOTION_FACTOR;
        });
      }
    }
    
    // Check for winner
    const types = Object.keys(newCounts).filter((type) => newCounts[type as EntityType] > 0);
    if (types.length === 1 && entities.length > 0) {
      return; // Victory handled by parent
    }
    
    if (gameState.isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [canvasRef, entitiesRef, gameState, pokiSDK, scaledParams]);
  
  useEffect(() => {
    if (gameState.isRunning && !gameState.isPaused) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isRunning, gameState.isPaused, animate]);
  
  return { animate, animationFrameRef };
};
