import { useEffect, useRef, useState } from "react";
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
}

const EMOJI_MAP = {
  rock: "🪨",
  paper: "📜",
  scissors: "✂️",
};

const SPAWN_PRESETS = [15, 20, 25];

const STRINGS = {
  en: {
    winStreak: "win streak",
    victoryYou: "Victory! 🎉",
    victoryOther: "Defeat 😔",
    dominanceAchieved: "Total domination achieved",
    playAgain: "Play Again",
    continue: "Continue",
    speed: "Speed",
  },
};

// Helper function: calcola parametri scalati in base alle dimensioni dell'arena
const getScaledParameters = (arenaSize: number) => {
  // Base: arena 600px → entity 32px (rapporto 18.75:1)
  const baseArenaSize = 600;
  const baseEntitySize = 24;
  const scaleFactor = arenaSize / baseArenaSize;
  
  return {
    entitySize: Math.round(baseEntitySize * scaleFactor),
    speedMultiplier: scaleFactor,
    fontSizeEmoji: Math.round(baseEntitySize * scaleFactor),
  };
};

const RockPaperScissors = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<EntityType | null>(null);
  
  // Bet & watch mode state
  const [playerBet, setPlayerBet] = useState<EntityType | null>(null);
  const [streak, setStreak] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>("bet");
  
  // Configuration state
  const [rockCount, setRockCount] = useState(20);
  const [paperCount, setPaperCount] = useState(20);
  const [scissorsCount, setScissorsCount] = useState(20);
  const [speed, setSpeed] = useState(2);
  const [arenaSize, setArenaSize] = useState(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Spazio riservato dinamico: meno in landscape, più in portrait
    const reservedSpace = height < 500 ? 120 : 160;
    const availableHeight = height - reservedSpace;
    const availableWidth = width - 32; // padding laterale
    
    // Usa il minore tra width e height disponibili
    const maxSize = Math.min(availableHeight, availableWidth);
    
    if (width < 640) return Math.min(maxSize, 350); // Mobile
    if (width < 1024) return maxSize; // Tablet - rispetta sempre spazio disponibile
    return Math.min(maxSize, 600); // Desktop
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
  }>>([]);
  
  // Poki SDK integration
  const {
    isSDKReady,
    isAdPlaying,
    gameplayStart,
    gameplayStop,
    commercialBreak,
  } = usePokiSDK();
  
  // Load streak from localStorage
  useEffect(() => {
    const savedStreak = localStorage.getItem('rps_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
  }, []);

  // Call gameplayStart when SDK is ready and game loads
  useEffect(() => {
    if (isSDKReady) {
      gameplayStart();
      console.log("🎮 Poki: gameplayStart called on game load");
    }
  }, [isSDKReady, gameplayStart]);

  // Touch/click interaction handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gamePhase !== 'running') return;

    const handleTouch = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      // Coordinate relative al canvas
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      
      // Hit detection: trova entità toccata (usa entitySize dinamico)
      const { entitySize } = getScaledParameters(arenaSize);
      const touched = entitiesRef.current.find(entity => {
        const entityCenterX = entity.x + entitySize / 2;
        const entityCenterY = entity.y + entitySize / 2;
        const distance = Math.sqrt(
          Math.pow(x - entityCenterX, 2) + 
          Math.pow(y - entityCenterY, 2)
        );
        return distance < (entitySize * entity.scale) / 2;
      });
      
      if (touched) {
        // Trigger scale animation
        touched.targetScale = 1.2;
        
        // Reset dopo 250ms
        setTimeout(() => {
          touched.targetScale = 1.0;
        }, 250);
        
        // Aggiungi particella touch
        setTouchParticles(prev => [...prev, {
          id: Date.now() + Math.random(),
          x: clientX - rect.left,
          y: clientY - rect.top,
          timestamp: Date.now()
        }]);
      }
    };
    
    canvas.addEventListener('mousedown', handleTouch);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousedown', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gamePhase]);

  // Handle responsive arena size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      const reservedSpace = height < 500 ? 120 : 160;
      const availableHeight = height - reservedSpace;
      const availableWidth = width - 32;
      const maxSize = Math.min(availableHeight, availableWidth);
      
      if (width < 640) setArenaSize(Math.min(maxSize, 350));
      else if (width < 1024) setArenaSize(maxSize); // Rispetta sempre spazio disponibile
      else setArenaSize(Math.min(maxSize, 600));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    // ✅ Calcola parametri scalati in base all'arena
    const { entitySize, speedMultiplier } = getScaledParameters(arenaSize);
    
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
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    setSpeed(newSpeed[0]);
    
    // ✅ Applica speed multiplier basato sull'arena size
    const { speedMultiplier } = getScaledParameters(arenaSize);
    
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
    setCounts({ rock: 0, paper: 0, scissors: 0 });
    setPrevCounts({ rock: 0, paper: 0, scissors: 0 });
    
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
    
    // ✅ Calcola parametri scalati per rendering
    const { entitySize, fontSizeEmoji } = getScaledParameters(arenaSize);
    
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
        const collisionThreshold = Math.max(effectiveSize1, effectiveSize2) / 2;
        
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
          }
          if (winner !== entities[j].type) {
            entities[j].type = winner;
            battleStatsRef.current.totalCollisions++;
          }
        }
      }
    }
    
    // Draw entities with scale (✅ usa fontSizeEmoji dinamico)
    entities.forEach((entity) => {
      ctx.save();
      ctx.translate(entity.x + entitySize / 2, entity.y + entitySize / 2);
      ctx.scale(entity.scale, entity.scale);
      ctx.font = `${fontSizeEmoji}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(EMOJI_MAP[entity.type], 0, 0);
      ctx.restore();
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
        (type) => newCounts[type as EntityType] < 10
      );
      
      if (losingTypes.length > 0) {
        isSlowMotionRef.current = true;
        // Reduce speed to 30%
        entitiesRef.current.forEach(entity => {
          entity.vx *= 0.3;
          entity.vy *= 0.3;
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
            
            <Card className="w-full max-w-4xl mx-auto p-3 sm:p-6 shadow-lg">
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
                      <span className="segment-value">{counts.rock}</span>
                    </span>
                  </span>
                  
                  <span 
                    className={`bar paper ${playerBet === 'paper' ? 'bet-active' : ''} ${counts.paper > counts.rock && counts.paper > counts.scissors ? 'leader' : ''}`}
                    style={{ width: `${(counts.paper / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
                  >
                    <span className="segment-content">
                      <span className="segment-emoji">📜</span>
                      <span className="segment-value">{counts.paper}</span>
                    </span>
                  </span>
                  
                  <span 
                    className={`bar scissors ${playerBet === 'scissors' ? 'bet-active' : ''} ${counts.scissors > counts.rock && counts.scissors > counts.paper ? 'leader' : ''}`}
                    style={{ width: `${(counts.scissors / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
                  >
                    <span className="segment-content">
                      <span className="segment-emoji">✂️</span>
                      <span className="segment-value">{counts.scissors}</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="canvas-wrapper">
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
                  className="touch-particle"
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
                  {STRINGS.en.speed}: {speed}x
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
                  ? STRINGS.en.victoryYou 
                  : STRINGS.en.victoryOther}
              </h2>
              
              <p className="dominance-text">
                {STRINGS.en.dominanceAchieved}
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
                    {STRINGS.en.winStreak}
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
                  {STRINGS.en.playAgain}
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
