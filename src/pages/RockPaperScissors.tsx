import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import totalArenaLogo from "@/assets/total-arena-logo.png";
import { usePokiSDK } from "@/hooks/usePokiSDK";

type EntityType = "rock" | "paper" | "scissors";
type GamePhase = "bet" | "running" | "victory";

interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: EntityType;
  size: number;
  scale: number;
  targetScale: number;
  scaleSpeed: number;
  // 🚀 Boost system
  isBoosted: boolean;
  boostEndTime: number;
  boostMultiplier: number;
  lastClickTime: number;
}

// Custom hook for animated counter numbers
const useAnimatedCounter = (target: number, duration: number = 300) => {
  const [current, setCurrent] = useState(target);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (prevTargetRef.current === target) return;
    
    const start = prevTargetRef.current;
    const diff = target - start;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      setCurrent(Math.round(start + diff * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = target;
      }
    };
    
    animate();
  }, [target, duration]);
  
  return current;
};

const EMOJI_MAP = {
  rock: "🪨",
  paper: "📜",
  scissors: "✂️",
};

const SPAWN_PRESETS = [15, 20, 25];

// Helper: Apply boost to entity (pure function)
const applyBoostToEntity = (entity: Entity, now: number): boolean => {
  const CLICK_COOLDOWN = 3000;
  const BOOST_DURATION = 2000;
  const BOOST_SPEED_MULT = 1.8;
  
  if (now - entity.lastClickTime < CLICK_COOLDOWN) {
    return false; // Cooldown active
  }
  
  entity.isBoosted = true;
  entity.boostEndTime = now + BOOST_DURATION;
  entity.boostMultiplier = BOOST_SPEED_MULT;
  entity.lastClickTime = now;
  
  const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
  const newSpeed = currentSpeed * BOOST_SPEED_MULT;
  const angle = Math.atan2(entity.vy, entity.vx);
  entity.vx = Math.cos(angle) * newSpeed;
  entity.vy = Math.sin(angle) * newSpeed;
  
  return true;
};

// Helper: Render entity on canvas (extracted rendering logic)
const renderEntity = (
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

const RockPaperScissors = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<EntityType | null>(null);
  
  // Bet & watch mode state
  const [playerBet, setPlayerBet] = useState<EntityType | null>(null);
  const [streak, setStreak] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("bet");
  
  // 🌟 Combo system
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lastConversionType, setLastConversionType] = useState<EntityType | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const COMBO_TIMEOUT = 2000;
  
  // Betting experience enhancements
  const [betConfetti, setBetConfetti] = useState<Array<{
    id: number;
    x: number;
    y: number;
    emoji: string;
  }>>([]);
  const [bettingTimeLeft, setBettingTimeLeft] = useState(15);
  
  // Configuration state
  const [rockCount, setRockCount] = useState(20);
  const [paperCount, setPaperCount] = useState(20);
  const [scissorsCount, setScissorsCount] = useState(20);
  const [speed, setSpeed] = useState(2);
  const [arenaSize, setArenaSize] = useState(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 🎯 FIX: Aumenta spazio riservato per UI (logo + progress bar + bet pill + margins)
    let reservedSpace: number;
    
    if (height < 500) {
      // Landscape mobile: UI ultra-compatta
      reservedSpace = 140;
    } else if (width < 640) {
      // Mobile portrait: più spazio per UI verticale
      reservedSpace = 200;
    } else if (width < 1024) {
      // Tablet: medio spazio
      reservedSpace = 180;
    } else {
      // Desktop: UI full size
      reservedSpace = 200;
    }
    
    const availableHeight = height - reservedSpace;
    const availableWidth = width - 32;
    const maxSize = Math.min(availableHeight, availableWidth);
    
    if (width < 640) return Math.min(maxSize, 350);
    if (width < 1024) return maxSize;
    return Math.min(maxSize, 600);
  });
  
  // Live counters
  const [counts, setCounts] = useState({ rock: 0, paper: 0, scissors: 0 });
  const [prevCounts, setPrevCounts] = useState({ rock: 0, paper: 0, scissors: 0 });
  const [prevLeader, setPrevLeader] = useState<EntityType | null>(null);
  
  // Juiciness state
  const [countdown, setCountdown] = useState<number | null>(null);
  const isSlowMotionRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const battleStatsRef = useRef({
    startTime: 0,
    totalCollisions: 0,
    duration: 0
  });
  const [battleStatsFinal, setBattleStatsFinal] = useState({
    startTime: 0,
    totalCollisions: 0,
    duration: 0
  });
  
  const entitiesRef = useRef<Entity[]>([]);
  const animationFrameRef = useRef<number>();
  
  // Touch particles state
  const [touchParticles, setTouchParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    timestamp: number;
    type?: 'boost' | 'combo';
    comboLevel?: number;
  }>>([]);
  
  // Poki SDK integration
  const {
    isSDKReady,
    isAdPlaying,
    gameplayStart,
    gameplayStop,
    commercialBreak,
  } = usePokiSDK();
  
  // Animated counters for smooth number transitions
  const animatedRockCount = useAnimatedCounter(counts.rock);
  const animatedPaperCount = useAnimatedCounter(counts.paper);
  const animatedScissorsCount = useAnimatedCounter(counts.scissors);
  
  // Memoized scaled parameters (recalculates only when arenaSize changes)
  const scaledParams = useMemo(() => {
    const baseArenaSize = 600;
    const baseEntitySize = 32;
    const scaleFactor = arenaSize / baseArenaSize;
    
    return {
      entitySize: Math.round(baseEntitySize * scaleFactor),
      speedMultiplier: scaleFactor,
      fontSizeEmoji: Math.round(baseEntitySize * scaleFactor),
    };
  }, [arenaSize]);
  
  // Load streak from localStorage
  useEffect(() => {
    const savedStreak = localStorage.getItem('rps_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  }, []);
  
  // Betting timer countdown
  useEffect(() => {
    if (gamePhase === 'bet' && bettingTimeLeft > 0) {
      const timer = setInterval(() => {
        setBettingTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gamePhase, bettingTimeLeft]);

  // Touch/click interaction handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gamePhase !== 'running') return;

    const handleTouch = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      const canvasRect = canvas.getBoundingClientRect();
      const wrapperRect = wrapperRef.current?.getBoundingClientRect();
      if (!wrapperRect) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      // Coordinate canvas per hit detection
      const scaleX = canvas.width / canvasRect.width;
      const scaleY = canvas.height / canvasRect.height;
      const xCanvas = (clientX - canvasRect.left) * scaleX;
      const yCanvas = (clientY - canvasRect.top) * scaleY;
      
      // Hit detection: trova entità toccata (usa entitySize dinamico)
      const { entitySize } = scaledParams;
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
        const boosted = applyBoostToEntity(touched, now);
        
        if (!boosted) {
          // Feedback visivo: shake veloce (cooldown attivo)
          touched.targetScale = 0.95;
          setTimeout(() => { touched.targetScale = 1.0; }, 100);
          return;
        }
        
        // Boost applicato con successo - trigger animazioni
        touched.targetScale = 1.2;
        setTimeout(() => { touched.targetScale = 1.0; }, 250);
        
        // Particelle DORATE (boost)
        setTouchParticles(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: clientX - wrapperRect.left,
          y: clientY - wrapperRect.top,
          timestamp: Date.now(),
          type: 'boost'
        }]);
      }
    };
    
    canvas.addEventListener('mousedown', handleTouch);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gamePhase, arenaSize, scaledParams]);

  // Handle responsive arena size (merged resize handlers)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let reservedSpace: number;
      if (height < 500) {
        reservedSpace = 140;
      } else if (width < 640) {
        reservedSpace = 200;
      } else if (width < 1024) {
        reservedSpace = 180;
      } else {
        reservedSpace = 200;
      }
      
      const availableHeight = height - reservedSpace;
      const availableWidth = width - 32;
      const maxSize = Math.min(availableHeight, availableWidth);
      
      let newSize: number;
      if (width < 640) newSize = Math.min(maxSize, 350);
      else if (width < 1024) newSize = maxSize;
      else newSize = Math.min(maxSize, 600);
      
      if (Math.abs(newSize - arenaSize) > 10) { // Evita resize troppo frequenti
        setArenaSize(newSize);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [arenaSize]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished, start game
      setCountdown(null);
      setGamePhase('running');
      setIsRunning(true);
      setIsPaused(false);
      initializeEntities();
      battleStatsRef.current.startTime = Date.now();
      battleStatsRef.current.totalCollisions = 0;
      
      // 🎮 Poki: Notify gameplay actually started
      gameplayStart();
      console.log("🎮 Poki: gameplayStart called after countdown");
    }
  }, [countdown]);

  // Track stats when game starts
  useEffect(() => {
    if (gamePhase === 'running' && isRunning && battleStatsRef.current.startTime === 0) {
      battleStatsRef.current.startTime = Date.now();
      battleStatsRef.current.totalCollisions = 0;
    }
  }, [gamePhase, isRunning]);

  const initializeEntities = () => {
    const entities: Entity[] = [];
    
    // ✅ Usa parametri scalati memoizzati
    const { entitySize, speedMultiplier } = scaledParams;
    
    // Create rocks
    for (let i = 0; i < rockCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed * speedMultiplier,
        vy: (Math.random() - 0.5) * speed * speedMultiplier,
        type: "rock",
        size: entitySize,
        scale: 1.0,
        targetScale: 1.0,
        scaleSpeed: 0.25,
        isBoosted: false,
        boostEndTime: 0,
        boostMultiplier: 1.0,
        lastClickTime: 0,
      });
    }
    
    // Create papers
    for (let i = 0; i < paperCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed * speedMultiplier,
        vy: (Math.random() - 0.5) * speed * speedMultiplier,
        type: "paper",
        size: entitySize,
        scale: 1.0,
        targetScale: 1.0,
        scaleSpeed: 0.25,
        isBoosted: false,
        boostEndTime: 0,
        boostMultiplier: 1.0,
        lastClickTime: 0,
      });
    }
    
    // Create scissors
    for (let i = 0; i < scissorsCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed * speedMultiplier,
        vy: (Math.random() - 0.5) * speed * speedMultiplier,
        type: "scissors",
        size: entitySize,
        scale: 1.0,
        targetScale: 1.0,
        scaleSpeed: 0.25,
        isBoosted: false,
        boostEndTime: 0,
        boostMultiplier: 1.0,
        lastClickTime: 0,
      });
    }
    
    entitiesRef.current = entities;
    
    // Update counts
    const newCounts = { rock: 0, paper: 0, scissors: 0 };
    entities.forEach((entity) => {
      newCounts[entity.type]++;
    });
    setCounts(newCounts);
  };

  const handleBet = async (bet: EntityType) => {
    setPlayerBet(bet);
    
    // 🎉 Mini confetti burst on bet selection
    const betCard = document.querySelector(`[data-bet="${bet}"]`);
    if (betCard) {
      const rect = betCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Generate 8 mini confetti particles
      const newConfetti = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        emoji: EMOJI_MAP[bet]
      }));
      
      setBetConfetti(newConfetti);
      setTimeout(() => setBetConfetti([]), 600); // Clear after animation
    }
    
    // 🎮 Poki: Notify gameplay start when user makes a bet
    gameplayStart();
    console.log("🎮 Poki: gameplayStart called on bet placement");
    
    // Randomize spawn preset
    const presetIndex = Math.floor(Math.random() * SPAWN_PRESETS.length);
    const count = SPAWN_PRESETS[presetIndex];
    
    // Set equalized counts
    setRockCount(count);
    setPaperCount(count);
    setScissorsCount(count);
    
    // Reset juiciness state
    isSlowMotionRef.current = false;
    setShowConfetti(false);
    battleStatsRef.current = { startTime: 0, totalCollisions: 0, duration: 0 };
    
     setCountdown(3);
     /*
    // Show commercial break before game starts
    await commercialBreak(
      () => {
        // Ad started - mute audio if any
        setIsMuted(true);
      },
      () => {
        // Ad finished - unmute and start countdown
        setIsMuted(false);
        setCountdown(3);
      }
    );
    */
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed[0]);
    
    // ✅ Usa speed multiplier memoizzato
    const { speedMultiplier } = scaledParams;
    
    // Update velocities of existing entities
    entitiesRef.current.forEach(entity => {
      const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
      if (currentSpeed > 0) {
        const direction = { 
          x: entity.vx / currentSpeed, 
          y: entity.vy / currentSpeed 
        };
        entity.vx = direction.x * newSpeed[0] * speedMultiplier;
        entity.vy = direction.y * newSpeed[0] * speedMultiplier;
      }
    });
  };

  const handleWinner = (winningType: EntityType) => {
    setWinner(winningType);
    setGamePhase('victory');
    setIsRunning(false);
    
    // Fire Poki gameplay stop
    gameplayStop();
    
    // Calculate battle stats
    const duration = Math.round((Date.now() - battleStatsRef.current.startTime) / 1000);
    setBattleStatsFinal({
      ...battleStatsRef.current,
      duration
    });
    
    // Trigger confetti for victory
    if (winningType === playerBet) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    if (winningType === playerBet) {
      // Increment streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('rps_streak', newStreak.toString());
    } else {
      // Reset streak
      setStreak(0);
      localStorage.setItem('rps_streak', '0');
    }
  };

  const handlePlayAgain = () => {
    setGamePhase('bet');
    setIsRunning(false);
    setIsPaused(false);
    setWinner(null);
    setPlayerBet(null);
    isSlowMotionRef.current = false;
    setShowConfetti(false);
    battleStatsRef.current = { startTime: 0, totalCollisions: 0, duration: 0 };
    entitiesRef.current = [];
    
    // Reset combo
    setCurrentCombo(0);
    setMaxCombo(0);
    setLastConversionType(null);
    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
    setCounts({ rock: 0, paper: 0, scissors: 0 });
    setPrevCounts({ rock: 0, paper: 0, scissors: 0 });
    setBettingTimeLeft(15); // Reset betting timer
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  const animate = () => {
    // Don't animate during ads
    if (isAdPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    
    if (!canvasRef.current || isPaused) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // ✅ Usa parametri scalati memoizzati
    const { entitySize, fontSizeEmoji } = scaledParams;
    
    // Clear canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply slow-motion spotlight effect
    if (isSlowMotionRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    
    const entities = entitiesRef.current;
    
    // Update scale interpolation
    entities.forEach((entity) => {
      if (entity.scale !== entity.targetScale) {
        entity.scale += (entity.targetScale - entity.scale) * entity.scaleSpeed;
        
        // Snap to target quando molto vicino
        if (Math.abs(entity.scale - entity.targetScale) < 0.01) {
          entity.scale = entity.targetScale;
        }
      }
    });
    
    // Update positions
    entities.forEach((entity) => {
      entity.x += entity.vx;
      entity.y += entity.vy;
      
      // Bounce off walls (usa entitySize dinamico)
      if (entity.x <= 0 || entity.x >= canvas.width - entitySize) {
        entity.vx *= -1;
        entity.x = Math.max(0, Math.min(entity.x, canvas.width - entitySize));
      }
      if (entity.y <= 0 || entity.y >= canvas.height - entitySize) {
        entity.vy *= -1;
        entity.y = Math.max(0, Math.min(entity.y, canvas.height - entitySize));
      }
    });
    
    // Check collisions and transform
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const dx = entities[i].x - entities[j].x;
        const dy = entities[i].y - entities[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // ✅ Use scaled size for collision detection (entitySize dinamico)
        const effectiveSize1 = entitySize * entities[i].scale;
        const effectiveSize2 = entitySize * entities[j].scale;
        // Fix: collision threshold = sum of radii (not max/2)
        const radius1 = effectiveSize1 / 2;
        const radius2 = effectiveSize2 / 2;
        const collisionThreshold = radius1 + radius2;
        
        if (distance < collisionThreshold) {
          const type1 = entities[i].type;
          const type2 = entities[j].type;
          
          let winner: EntityType;
          if (type1 === type2) {
            winner = type1;
          } else if (type1 === "rock" && type2 === "scissors") {
            winner = "rock";
          } else if (type1 === "scissors" && type2 === "paper") {
            winner = "scissors";
          } else if (type1 === "paper" && type2 === "rock") {
            winner = "paper";
          } else {
            winner = type2;
          }
          
          if (winner !== entities[i].type) {
            entities[i].type = winner;
            battleStatsRef.current.totalCollisions++;
            
            // 🌟 COMBO LOGIC
            if (lastConversionType === winner) {
              // Stessa entità continua a convertire → Incrementa combo
              setCurrentCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(max => Math.max(max, newCombo));
                return newCombo;
              });
            } else {
              // Tipo diverso → Reset combo
              setCurrentCombo(1);
              setLastConversionType(winner);
            }
            
            // Reset timeout: se nessuna conversione per 2s, azzera combo
            if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
            comboTimeoutRef.current = setTimeout(() => {
              setCurrentCombo(0);
              setLastConversionType(null);
            }, COMBO_TIMEOUT);
            
            // Particelle combo se combo >= 3
            if (currentCombo >= 3) {
              const particleCount = Math.min(currentCombo, 10);
              for (let k = 0; k < particleCount; k++) {
                setTouchParticles(prev => [...prev, {
                  id: Date.now() + Math.random() + k,
                  x: (entities[i].x + entitySize / 2) * (canvas.width / arenaSize),
                  y: (entities[i].y + entitySize / 2) * (canvas.height / arenaSize),
                  timestamp: Date.now(),
                  type: 'combo',
                  comboLevel: currentCombo
                }]);
              }
            }
          }
          if (winner !== entities[j].type) {
            entities[j].type = winner;
            battleStatsRef.current.totalCollisions++;
            
            // 🌟 COMBO LOGIC (stesso codice per entities[j])
            if (lastConversionType === winner) {
              setCurrentCombo(prev => {
                const newCombo = prev + 1;
                setMaxCombo(max => Math.max(max, newCombo));
                return newCombo;
              });
            } else {
              setCurrentCombo(1);
              setLastConversionType(winner);
            }
            
            if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
            comboTimeoutRef.current = setTimeout(() => {
              setCurrentCombo(0);
              setLastConversionType(null);
            }, COMBO_TIMEOUT);
            
            // Particelle combo
            if (currentCombo >= 3) {
              const particleCount = Math.min(currentCombo, 10);
              for (let k = 0; k < particleCount; k++) {
                setTouchParticles(prev => [...prev, {
                  id: Date.now() + Math.random() + k + 100,
                  x: (entities[j].x + entitySize / 2) * (canvas.width / arenaSize),
                  y: (entities[j].y + entitySize / 2) * (canvas.height / arenaSize),
                  timestamp: Date.now(),
                  type: 'combo',
                  comboLevel: currentCombo
                }]);
              }
            }
          }
        }
      }
    }
    
    // Draw entities with scale (extracted rendering logic)
    entities.forEach((entity) => {
      renderEntity(ctx, entity, entitySize, fontSizeEmoji);
      
      // Reset boost se scaduto (game logic stays here)
      if (entity.isBoosted && Date.now() >= entity.boostEndTime) {
        entity.isBoosted = false;
        entity.boostMultiplier = 1.0;
        // Ritorna a velocità normale
        const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
        const normalSpeed = currentSpeed / 1.8; // Inverti il boost
        const angle = Math.atan2(entity.vy, entity.vx);
        entity.vx = Math.cos(angle) * normalSpeed;
        entity.vy = Math.sin(angle) * normalSpeed;
      }
    });
    
    // Update counts and check for winner
    const newCounts = { rock: 0, paper: 0, scissors: 0 };
    entities.forEach((entity) => {
      newCounts[entity.type]++;
    });
    
    // Only update counts if they've changed
    const countsChanged = 
      newCounts.rock !== counts.rock ||
      newCounts.paper !== counts.paper ||
      newCounts.scissors !== counts.scissors;
    
    if (countsChanged) {
      setPrevCounts(counts);
      setCounts(newCounts);
    }
    
    // Check for slow-motion trigger (2 species with <10 entities)
    const typesWithEntities = Object.keys(newCounts).filter(
      (type) => newCounts[type as EntityType] > 0
    );
    
    if (typesWithEntities.length === 2 && !isSlowMotionRef.current) {
      const losingTypes = typesWithEntities.filter(
        (type) => newCounts[type as EntityType] < 5
      );
      
      if (losingTypes.length > 0) {
        isSlowMotionRef.current = true;
        // Reduce speed to 40%
        entitiesRef.current.forEach(entity => {
          entity.vx *= 0.4;
          entity.vy *= 0.4;
        });
      }
    }
    
    const types = Object.keys(newCounts).filter((type) => newCounts[type as EntityType] > 0);
    if (types.length === 1 && entities.length > 0) {
      handleWinner(types[0] as EntityType);
      return;
    }
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };


  useEffect(() => {
    if (isRunning && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Leader change detection for glow effect
  useEffect(() => {
    const currentLeader = 
      counts.rock > counts.paper && counts.rock > counts.scissors ? 'rock' :
      counts.paper > counts.rock && counts.paper > counts.scissors ? 'paper' :
      counts.scissors > counts.rock && counts.scissors > counts.paper ? 'scissors' :
      null;
    
    if (currentLeader && currentLeader !== prevLeader) {
      setPrevLeader(currentLeader);
    }
  }, [counts, prevLeader]);

  // Screen shake su mega combo (≥10)
  useEffect(() => {
    if (currentCombo >= 10 && wrapperRef.current) {
      wrapperRef.current.classList.add('mega-combo');
      setTimeout(() => {
        wrapperRef.current?.classList.remove('mega-combo');
      }, 300);
    }
  }, [currentCombo]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && isRunning) {
        e.preventDefault();
        const newPausedState = !isPaused;
        setIsPaused(newPausedState);
        
        // Fire Poki events
        if (newPausedState) {
          gameplayStop(); // Pausing
        } else {
          gameplayStart(); // Unpausing
        }
      }
      
      if (e.code === "Escape" && gamePhase === 'victory') {
        e.preventDefault();
        handlePlayAgain();
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRunning, isPaused, gamePhase]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background to-accent/10 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-6xl mx-auto w-full">

        {/* Bet Screen */}
        {gamePhase === 'bet' && (
          <div id="betScreen" className="w-full space-y-3 sm:space-y-4">
            <div className="text-center mb-2 sm:mb-4">
              <img 
                src={totalArenaLogo} 
                alt="Total Arena - Rock Paper Scissors" 
                className="mx-auto h-[8vh] md:h-[12vh] w-auto drop-shadow-lg"
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
                  onClick={() => handleBet('rock')}
                  className="bet-card group"
                >
                  <span className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-4 block group-hover:scale-110 transition-transform">
                    🪨
                  </span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono">Rock</span>
                </button>
                
                <button
                  data-bet="paper"
                  onClick={() => handleBet('paper')}
                  className="bet-card group"
                >
                  <span className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-4 block group-hover:scale-110 transition-transform">
                    📜
                  </span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold font-mono">Paper</span>
                </button>
                
                <button
                  data-bet="scissors"
                  onClick={() => handleBet('scissors')}
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
        )}

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="countdown-overlay">
            <div className="countdown-number">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </div>
        )}

        {/* Running Phase */}
        {gamePhase === 'running' && (
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
              
              {/* Progress Bar Container (relative per bet pill absolute) */}
              <div className="arena-bar-wrapper">
                {/* Bet Pill Floating */}
                <div 
                  id="betPill" 
                  className="bet-pill-floating"
                  data-bet-type={playerBet || undefined}
                >
                  Your bet: {EMOJI_MAP[playerBet!]}
                </div>
                
                {/* Progress Bar a 3 Segmenti */}
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

            {/* Combo Badge - floating sopra arena */}
            {currentCombo >= 3 && gamePhase === 'running' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                <div 
                  className="px-6 py-3 rounded-full font-bold text-2xl shadow-2xl transition-all duration-300"
                  style={{
                    background: currentCombo >= 10 
                      ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
                      : currentCombo >= 7
                      ? 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'
                      : 'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
                    transform: `scale(${1 + currentCombo * 0.05})`,
                    animation: currentCombo >= 10 ? 'pulse 0.5s infinite' : 'none'
                  }}
                >
                  <span className="text-white drop-shadow-lg">
                    x{currentCombo} COMBO! 🔥
                  </span>
                </div>
              </div>
            )}

            {/* Canvas */}
            <div ref={wrapperRef} className="canvas-wrapper relative">
              <canvas
                id="canvas"
                ref={canvasRef}
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
                  onAnimationEnd={() => {
                    setTouchParticles(prev => 
                      prev.filter(p => p.id !== particle.id)
                    );
                  }}
                />
              ))}
            </div>

            {/* Speed Control */}
            <Card className="p-3 sm:p-4">
              <div className="space-y-1 sm:space-y-2">
                <label className="text-sm font-medium font-mono" id="speedSlider">
                  Speed: {speed}x
                </label>
                <Slider
                  value={[speed]}
                  onValueChange={handleSpeedChange}
                  min={0.5}
                  max={5}
                  step={0.5}
                  aria-labelledby="speedSlider"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Victory Overlay */}
        {gamePhase === 'victory' && winner && (
          <div 
            id="winnerOverlay" 
            className="winner-overlay"
            role="dialog"
            aria-labelledby="winnerTitle"
          >
            <div className="winner-content">
              {/* Confetti */}
              {showConfetti && (
                <div className="confetti-container">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                      key={i}
                      className="confetti-piece"
                      style={{
                        '--x': `${Math.random() * 100}vw`,
                        '--duration': `${2 + Math.random() * 2}s`,
                        '--delay': `${Math.random() * 0.5}s`,
                      } as React.CSSProperties}
                    >
                      {EMOJI_MAP[winner]}
                    </div>
                  ))}
                </div>
              )}
              
              <div 
                id="winnerEmoji" 
                className="winner-emoji-burst"
                data-emoji={EMOJI_MAP[winner]}
              >
                {EMOJI_MAP[winner]}
              </div>
              
              <h2 id="winnerTitle" className="winner-title">
                {winner === playerBet 
                  ? "Victory! 🎉" 
                  : "Defeat 😔"}
              </h2>
              
              <p className="dominance-text">
                Total domination achieved
              </p>
              
              {/* Stats Recap */}
              <div className="stats-recap">
                <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.2s' }}>
                  <span className="stat-icon">⏱️</span>
                  <span className="stat-value">{battleStatsFinal.duration}s</span>
                  <span className="stat-label">Battle Duration</span>
                </div>
                
                <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.4s' }}>
                  <span className="stat-icon">💥</span>
                  <span className="stat-value">{battleStatsFinal.totalCollisions}</span>
                  <span className="stat-label">Collisions</span>
                </div>
                
                <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.6s' }}>
                  <span className="stat-icon">👑</span>
                  <span className="stat-value">{EMOJI_MAP[winner]}</span>
                  <span className="stat-label">Champion</span>
                </div>
                
                {maxCombo >= 3 && (
                  <div className="stat-item animate-stat-slide" style={{ animationDelay: '0.8s' }}>
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">x{maxCombo}</span>
                    <span className="stat-label">Max Combo</span>
                  </div>
                )}
              </div>
              
              {winner === playerBet && streak > 0 && (
                <div 
                  id="streakCount" 
                  className="streak-display"
                  aria-live="polite"
                >
                  <span className="streak-emoji">🔥</span>
                  <span className="streak-number">{streak}</span>
                  <span className="streak-label">
                    win streak
                  </span>
                </div>
              )}
              
              <div className="victory-actions">
                <Button 
                  id="playAgainBtn"
                  onClick={handlePlayAgain}
                  size="lg"
                  className="font-mono"
                >
                  Play Again
                </Button>
              
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Ad Playing Overlay */}
      {isAdPlaying && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-white text-center space-y-4">
            <div className="text-2xl font-bold">Advertisement</div>
            <div className="text-sm opacity-75">Please wait...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RockPaperScissors;
