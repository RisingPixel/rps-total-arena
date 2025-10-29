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
  const [arenaSize] = useState(600);
  
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
      
      // Fire Poki gameplay start
      gameplayStart();
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
    const entitySize = 32;
    
    // Create rocks
    for (let i = 0; i < rockCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        type: "rock",
        size: entitySize,
      });
    }
    
    // Create papers
    for (let i = 0; i < paperCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        type: "paper",
        size: entitySize,
      });
    }
    
    // Create scissors
    for (let i = 0; i < scissorsCount; i++) {
      entities.push({
        x: Math.random() * (arenaSize - entitySize),
        y: Math.random() * (arenaSize - entitySize),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        type: "scissors",
        size: entitySize,
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
    // Update velocities of existing entities
    entitiesRef.current.forEach(entity => {
      const currentSpeed = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
      if (currentSpeed > 0) {
        const direction = { 
          x: entity.vx / currentSpeed, 
          y: entity.vy / currentSpeed 
        };
        entity.vx = direction.x * newSpeed[0];
        entity.vy = direction.y * newSpeed[0];
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
    
    // Update positions
    entities.forEach((entity) => {
      entity.x += entity.vx;
      entity.y += entity.vy;
      
      // Bounce off walls
      if (entity.x <= 0 || entity.x >= canvas.width - entity.size) {
        entity.vx *= -1;
        entity.x = Math.max(0, Math.min(entity.x, canvas.width - entity.size));
      }
      if (entity.y <= 0 || entity.y >= canvas.height - entity.size) {
        entity.vy *= -1;
        entity.y = Math.max(0, Math.min(entity.y, canvas.height - entity.size));
      }
    });
    
    // Check collisions and transform
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const dx = entities[i].x - entities[j].x;
        const dy = entities[i].y - entities[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < entities[i].size) {
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
    
    // Draw entities
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    entities.forEach((entity) => {
      ctx.fillText(EMOJI_MAP[entity.type], entity.x + entity.size / 2, entity.y + entity.size / 2);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Bet Screen */}
        {gamePhase === 'bet' && (
          <div id="betScreen" className="space-y-6">
            <div className="text-center mb-6">
              <img 
                src={totalArenaLogo} 
                alt="Total Arena - Rock Paper Scissors" 
                className="mx-auto h-24 md:h-32 w-auto drop-shadow-lg"
              />
            </div>
            
            <Card className="p-6 md:p-8 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <button
                  data-bet="rock"
                  onClick={() => handleBet('rock')}
                  className="bet-card group"
                >
                  <span className="text-7xl md:text-8xl mb-4 block group-hover:scale-110 transition-transform">
                    🪨
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-mono">Rock</span>
                </button>
                
                <button
                  data-bet="paper"
                  onClick={() => handleBet('paper')}
                  className="bet-card group"
                >
                  <span className="text-7xl md:text-8xl mb-4 block group-hover:scale-110 transition-transform">
                    📜
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-mono">Paper</span>
                </button>
                
                <button
                  data-bet="scissors"
                  onClick={() => handleBet('scissors')}
                  className="bet-card group"
                >
                  <span className="text-7xl md:text-8xl mb-4 block group-hover:scale-110 transition-transform">
                    ✂️
                  </span>
                  <span className="text-xl md:text-2xl font-bold font-mono">Scissors</span>
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
          <div className="space-y-4 mobile-gameplay-layout">
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
              
              {/* Counter Badges (micro, inline sopra i segmenti) */}
              <div className="counters-inline">
                <div className="micro-badge" data-type="rock">
                  <span className="emoji">🪨</span>
                  <span className="value">{counts.rock}</span>
                  {prevCounts.rock !== 0 && counts.rock !== prevCounts.rock && (
                    <span className={`momentum-micro ${counts.rock > prevCounts.rock ? 'up' : 'down'}`}>
                      {counts.rock > prevCounts.rock ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                
                <div className="micro-badge" data-type="paper">
                  <span className="emoji">📜</span>
                  <span className="value">{counts.paper}</span>
                  {prevCounts.paper !== 0 && counts.paper !== prevCounts.paper && (
                    <span className={`momentum-micro ${counts.paper > prevCounts.paper ? 'up' : 'down'}`}>
                      {counts.paper > prevCounts.paper ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                
                <div className="micro-badge" data-type="scissors">
                  <span className="emoji">✂️</span>
                  <span className="value">{counts.scissors}</span>
                  {prevCounts.scissors !== 0 && counts.scissors !== prevCounts.scissors && (
                    <span className={`momentum-micro ${counts.scissors > prevCounts.scissors ? 'up' : 'down'}`}>
                      {counts.scissors > prevCounts.scissors ? '↑' : '↓'}
                    </span>
                  )}
                </div>
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
                    {counts.rock > counts.paper && counts.rock > counts.scissors && (
                      <span className="dominant-value">{counts.rock}</span>
                    )}
                  </span>
                  
                  <span 
                    className={`bar paper ${playerBet === 'paper' ? 'bet-active' : ''} ${counts.paper > counts.rock && counts.paper > counts.scissors ? 'leader' : ''}`}
                    style={{ width: `${(counts.paper / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
                  >
                    {counts.paper > counts.rock && counts.paper > counts.scissors && (
                      <span className="dominant-value">{counts.paper}</span>
                    )}
                  </span>
                  
                  <span 
                    className={`bar scissors ${playerBet === 'scissors' ? 'bet-active' : ''} ${counts.scissors > counts.rock && counts.scissors > counts.paper ? 'leader' : ''}`}
                    style={{ width: `${(counts.scissors / (counts.rock + counts.paper + counts.scissors)) * 100}%` }}
                  >
                    {counts.scissors > counts.rock && counts.scissors > counts.paper && (
                      <span className="dominant-value">{counts.scissors}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex justify-center">
              <canvas
                id="canvas"
                ref={canvasRef}
                width={arenaSize}
                height={arenaSize}
                className="border-4 border-border rounded-lg shadow-lg bg-slate-50 max-w-full"
              />
            </div>

            {/* Speed Control */}
            <Card className="p-4">
              <div className="space-y-2">
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
