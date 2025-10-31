import { Entity, EntityType, TouchParticle } from '../types';

export const handleEntityConversion = (
  entity: Entity,
  winner: EntityType,
  params: {
    entitySize: number;
    canvasWidth: number;
    canvasHeight: number;
    arenaSize: number;
    currentCombo: number;
    lastConversionType: EntityType | null;
    comboTimeout: number;
    comboParticleThreshold: number;
    maxComboParticles: number;
  },
  callbacks: {
    incrementCollisions: () => void;
    setCurrentCombo: React.Dispatch<React.SetStateAction<number>>;
    setMaxCombo: React.Dispatch<React.SetStateAction<number>>;
    setLastConversionType: React.Dispatch<React.SetStateAction<EntityType | null>>;
    setTouchParticles: React.Dispatch<React.SetStateAction<TouchParticle[]>>;
    comboTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  }
) => {
  entity.type = winner;
  callbacks.incrementCollisions();
  
  // Combo logic
  if (params.lastConversionType === winner) {
    callbacks.setCurrentCombo(prev => {
      const newCombo = prev + 1;
      callbacks.setMaxCombo(max => Math.max(max, newCombo));
      return newCombo;
    });
  } else {
    callbacks.setCurrentCombo(1);
    callbacks.setLastConversionType(winner);
  }
  
  // Reset timeout
  if (callbacks.comboTimeoutRef.current) {
    clearTimeout(callbacks.comboTimeoutRef.current);
  }
  callbacks.comboTimeoutRef.current = setTimeout(() => {
    callbacks.setCurrentCombo(0);
    callbacks.setLastConversionType(null);
  }, params.comboTimeout);
  
  // Combo particles
  if (params.currentCombo >= params.comboParticleThreshold) {
    const particleCount = Math.min(params.currentCombo, params.maxComboParticles);
    const newParticles: TouchParticle[] = [];
    
    for (let k = 0; k < particleCount; k++) {
      newParticles.push({
        id: Date.now() + Math.random() + k,
        x: (entity.x + params.entitySize / 2) * (params.canvasWidth / params.arenaSize),
        y: (entity.y + params.entitySize / 2) * (params.canvasHeight / params.arenaSize),
        timestamp: Date.now(),
        type: 'combo',
        comboLevel: params.currentCombo
      });
    }
    
    callbacks.setTouchParticles(prev => [...prev, ...newParticles]);
  }
};

export const resetCombo = (
  setCurrentCombo: React.Dispatch<React.SetStateAction<number>>,
  setLastConversionType: React.Dispatch<React.SetStateAction<EntityType | null>>,
  comboTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  setCurrentCombo(0);
  setLastConversionType(null);
  if (comboTimeoutRef.current) {
    clearTimeout(comboTimeoutRef.current);
  }
};
