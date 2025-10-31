import { useEffect, useCallback, useRef } from "react";
import { Entity, GameState } from "../types";
import { applyBoostToEntity } from "../utils/physics";
import { GAME_CONFIG } from "../constants";

interface UseGameControlsParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  wrapperRef: React.RefObject<HTMLDivElement>;
  entitiesRef: React.MutableRefObject<Entity[]>;
  gameState: GameState;
  scaledParams: { entitySize: number };
}

export const useGameControls = ({ 
  canvasRef, 
  wrapperRef,
  entitiesRef, 
  gameState, 
  scaledParams 
}: UseGameControlsParams) => {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const wrapperRect = wrapperRef.current?.getBoundingClientRect();
    if (!canvas || !wrapperRect || gameState.gamePhase !== 'running') return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const { entitySize } = scaledParams;
    
    // Canvas coordinates for hit detection
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const xCanvas = (clientX - canvasRect.left) * scaleX;
    const yCanvas = (clientY - canvasRect.top) * scaleY;
    
    // Hit detection
    const touched = entitiesRef.current.find(entity => {
      const entityCenterX = entity.x + entitySize / 2;
      const entityCenterY = entity.y + entitySize / 2;
      const distance = Math.sqrt(
        Math.pow(xCanvas - entityCenterX, 2) + 
        Math.pow(yCanvas - entityCenterY, 2)
      );
      return distance < (entitySize * entity.scale) / 2;
    });
    
    if (touched) {
      const now = Date.now();
      const boosted = applyBoostToEntity(touched, now, {
        clickCooldown: GAME_CONFIG.CLICK_COOLDOWN,
        boostDuration: GAME_CONFIG.BOOST_DURATION,
        boostSpeedMult: GAME_CONFIG.BOOST_SPEED_MULT,
      });
      
      if (!boosted) {
        // Cooldown active - shake feedback
        touched.targetScale = GAME_CONFIG.SCALE_COOLDOWN;
        const timeout = setTimeout(() => { touched.targetScale = 1.0; }, GAME_CONFIG.SCALE_ANIMATION_COOLDOWN);
        timeoutsRef.current.push(timeout);
        return;
      }
      
      // Boost applied - scale animation
      touched.targetScale = GAME_CONFIG.SCALE_BOOST;
      const timeout = setTimeout(() => { touched.targetScale = 1.0; }, GAME_CONFIG.SCALE_ANIMATION_DURATION);
      timeoutsRef.current.push(timeout);
      
      // Boost particles
      gameState.setTouchParticles((prev: any[]) => [...prev, {
        id: Date.now() + Math.random(),
        x: clientX - wrapperRect.left,
        y: clientY - wrapperRect.top,
        timestamp: Date.now(),
        type: 'boost'
      }]);
    }
  }, [canvasRef, wrapperRef, entitiesRef, gameState, scaledParams, timeoutsRef]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);
  
  // Touch/click listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState.gamePhase !== 'running') return;
    
    const handleTouch = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      handleInteraction(clientX, clientY);
    };
    
    canvas.addEventListener('mousedown', handleTouch);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameState.gamePhase, scaledParams, handleInteraction]);
  
  return { handleInteraction };
};
