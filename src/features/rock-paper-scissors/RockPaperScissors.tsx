import { useEffect, useMemo, useRef, useState } from "react";
import { usePokiSDK } from "@/hooks/usePokiSDK";
import { useGameState } from "./hooks/useGameState";
import { useGameLoop } from "./hooks/useGameLoop";
import { useGameControls } from "./hooks/useGameControls";
import { useBackgroundMusic } from "./hooks/useBackgroundMusic";
import { useProgression } from "./hooks/useProgression";
import { BetScreen } from "./components/BetScreen";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { GameHUD } from "./components/GameHUD";
import { ComboBadge } from "./components/ComboBadge";
import { GameCanvas } from "./components/GameCanvas";
import { VictoryScreen } from "./components/VictoryScreen";
import { AudioToggle } from "./components/AudioToggle";
import { CoinDisplay } from "./components/CoinDisplay";
import { AchievementToast } from "./components/AchievementToast";
import { StatsPanel } from "./components/StatsPanel";
import { AchievementsGrid } from "./components/AchievementsGrid";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Entity, EntityType } from "./types";
import { EMOJI_MAP, GAME_CONFIG, SPAWN_PRESETS } from "./constants";
import { resetCombo } from "./utils/combo";

const RockPaperScissors = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const entitiesRef = useRef<Entity[]>([]);
  
  const gameState = useGameState();
  const pokiSDK = usePokiSDK();
  const progression = useProgression();
  
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  
  // Memoized scaled parameters
  const scaledParams = useMemo(() => {
    const scaleFactor = gameState.arenaSize / GAME_CONFIG.BASE_ARENA_SIZE;
    
    return {
      entitySize: Math.round(GAME_CONFIG.BASE_ENTITY_SIZE * scaleFactor),
      speedMultiplier: scaleFactor,
      fontSizeEmoji: Math.round(GAME_CONFIG.BASE_ENTITY_SIZE * scaleFactor),
    };
  }, [gameState.arenaSize]);
  
  const { animationFrameRef } = useGameLoop({
    canvasRef,
    entitiesRef,
    gameState,
    pokiSDK,
    scaledParams,
  });
  
  useGameControls({
    canvasRef,
    wrapperRef,
    entitiesRef,
    gameState,
    scaledParams,
  });
  
  useBackgroundMusic({
    isMuted: gameState.isMuted,
    isAdPlaying: pokiSDK.isAdPlaying,
    gamePhase: gameState.gamePhase,
  });
  
  // Handle responsive arena size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let reservedSpace: number;
      if (height < 500) {
        reservedSpace = GAME_CONFIG.RESERVED_SPACE_LANDSCAPE;
      } else if (width < GAME_CONFIG.MOBILE_MAX_WIDTH) {
        reservedSpace = GAME_CONFIG.RESERVED_SPACE_MOBILE;
      } else if (width < GAME_CONFIG.TABLET_MAX_WIDTH) {
        reservedSpace = GAME_CONFIG.RESERVED_SPACE_TABLET;
      } else {
        reservedSpace = GAME_CONFIG.RESERVED_SPACE_DESKTOP;
      }
      
      const availableHeight = height - reservedSpace;
      const availableWidth = width - 32;
      const maxSize = Math.min(availableHeight, availableWidth);
      
      let newSize: number;
      if (width < GAME_CONFIG.MOBILE_MAX_WIDTH) newSize = Math.min(maxSize, GAME_CONFIG.MOBILE_MAX_ARENA);
      else if (width < GAME_CONFIG.TABLET_MAX_WIDTH) newSize = maxSize;
      else newSize = Math.min(maxSize, GAME_CONFIG.DESKTOP_MAX_ARENA);
      
      if (Math.abs(newSize - gameState.arenaSize) > 10) {
        gameState.setArenaSize(newSize);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState.arenaSize]);
  
  // Countdown effect
  useEffect(() => {
    if (gameState.countdown === null) return;
    
    if (gameState.countdown > 0) {
      const timer = setTimeout(() => {
        gameState.setCountdown(gameState.countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      gameState.setCountdown(null);
      gameState.setGamePhase('running');
      gameState.setIsRunning(true);
      gameState.setIsPaused(false);
      initializeEntities();
      gameState.battleStatsRef.current.startTime = Date.now();
      gameState.battleStatsRef.current.totalCollisions = 0;
      
      pokiSDK.gameplayStart();
    }
  }, [gameState.countdown]);
  
  // Track stats when game starts
  useEffect(() => {
    if (gameState.gamePhase === 'running' && gameState.isRunning && gameState.battleStatsRef.current.startTime === 0) {
      gameState.battleStatsRef.current.startTime = Date.now();
      gameState.battleStatsRef.current.totalCollisions = 0;
    }
  }, [gameState.gamePhase, gameState.isRunning]);
  
  // Leader detection
  useEffect(() => {
    const currentLeader = 
      gameState.counts.rock > gameState.counts.paper && gameState.counts.rock > gameState.counts.scissors ? 'rock' :
      gameState.counts.paper > gameState.counts.rock && gameState.counts.paper > gameState.counts.scissors ? 'paper' :
      gameState.counts.scissors > gameState.counts.rock && gameState.counts.scissors > gameState.counts.paper ? 'scissors' :
      null;
    
    if (currentLeader && currentLeader !== gameState.prevLeader) {
      gameState.setPrevLeader(currentLeader);
    }
  }, [gameState.counts, gameState.prevLeader]);
  
  // Screen shake on mega combo
  useEffect(() => {
    if (gameState.currentCombo >= GAME_CONFIG.MEGA_COMBO_THRESHOLD && wrapperRef.current) {
      wrapperRef.current.classList.add('mega-combo');
      setTimeout(() => {
        wrapperRef.current?.classList.remove('mega-combo');
      }, 300);
    }
  }, [gameState.currentCombo]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && gameState.gamePhase === 'running') {
        e.preventDefault();
        setShowSpeedControl(prev => !prev);
      }
      
      if (e.code === "Escape" && gameState.gamePhase === 'victory') {
        e.preventDefault();
        handlePlayAgain();
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gamePhase]);
  
  // Check for winner
  useEffect(() => {
    if (gameState.gamePhase !== 'running') return;
    
    const types = Object.keys(gameState.counts).filter(
      (type) => gameState.counts[type as EntityType] > 0
    );
    
    if (types.length === 1 && entitiesRef.current.length > 0) {
      handleWinner(types[0] as EntityType);
    }
  }, [gameState.counts, gameState.gamePhase]);
  
  const initializeEntities = () => {
    const entities: Entity[] = [];
    const { entitySize, speedMultiplier } = scaledParams;
    
    const createEntity = (type: EntityType) => ({
      x: Math.random() * (gameState.arenaSize - entitySize),
      y: Math.random() * (gameState.arenaSize - entitySize),
      vx: (Math.random() - 0.5) * gameState.speed * speedMultiplier,
      vy: (Math.random() - 0.5) * gameState.speed * speedMultiplier,
      type,
      size: entitySize,
      scale: 1.0,
      targetScale: 1.0,
      scaleSpeed: GAME_CONFIG.SCALE_SPEED,
      isBoosted: false,
      boostEndTime: 0,
      boostMultiplier: 1.0,
      lastClickTime: 0,
    });
    
    for (let i = 0; i < gameState.rockCount; i++) entities.push(createEntity("rock"));
    for (let i = 0; i < gameState.paperCount; i++) entities.push(createEntity("paper"));
    for (let i = 0; i < gameState.scissorsCount; i++) entities.push(createEntity("scissors"));
    
    entitiesRef.current = entities;
    
    const newCounts = { rock: 0, paper: 0, scissors: 0 };
    entities.forEach((entity) => {
      newCounts[entity.type]++;
    });
    gameState.setCounts(newCounts);
  };
  
  const handleBet = async (bet: EntityType) => {
    gameState.setPlayerBet(bet);
    
    // Mini confetti burst
    const betCard = document.querySelector(`[data-bet="${bet}"]`);
    if (betCard) {
      const rect = betCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const newConfetti = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        emoji: EMOJI_MAP[bet]
      }));
      
      gameState.setBetConfetti(newConfetti);
      setTimeout(() => gameState.setBetConfetti([]), GAME_CONFIG.CONFETTI_DURATION);
    }
    
    pokiSDK.gameplayStart();
    
    // Randomize spawn preset
    const presetIndex = Math.floor(Math.random() * SPAWN_PRESETS.length);
    const count = SPAWN_PRESETS[presetIndex];
    
    gameState.setRockCount(count);
    gameState.setPaperCount(count);
    gameState.setScissorsCount(count);
    
    // Reset state
    gameState.isSlowMotionRef.current = false;
    gameState.setShowConfetti(false);
    gameState.battleStatsRef.current = { startTime: 0, totalCollisions: 0, duration: 0 };
    
    gameState.setCountdown(GAME_CONFIG.COUNTDOWN_DURATION);
  };
  
  const handleSpeedChange = (newSpeed: number[]) => {
    gameState.setSpeed(newSpeed[0]);
    
    const { speedMultiplier } = scaledParams;
    
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
    gameState.setWinner(winningType);
    gameState.setGamePhase('victory');
    gameState.setIsRunning(false);
    
    pokiSDK.gameplayStop();
    
    const duration = Math.round((Date.now() - gameState.battleStatsRef.current.startTime) / 1000);
    gameState.setBattleStatsFinal({
      ...gameState.battleStatsRef.current,
      duration
    });
    
    const won = winningType === gameState.playerBet;
    
    if (won) {
      gameState.setShowConfetti(true);
      setTimeout(() => gameState.setShowConfetti(false), GAME_CONFIG.CONFETTI_VICTORY_DURATION);
    }
    
    const currentStreak = gameState.streak;
    gameState.updateStreak(won);
    
    // Record progression
    progression.recordGameResult(
      won,
      won ? currentStreak + 1 : 0,
      gameState.maxCombo,
      duration,
      gameState.battleStatsRef.current.totalCollisions,
      gameState.speed
    );
  };
  
  const handleToggleMute = () => {
    const newMutedState = !gameState.isMuted;
    gameState.setIsMuted(newMutedState);
    localStorage.setItem('rps_audio_muted', newMutedState.toString());
  };
  
  const handlePlayAgain = () => {
    gameState.setGamePhase('bet');
    gameState.setIsRunning(false);
    gameState.setIsPaused(false);
    gameState.setWinner(null);
    gameState.setPlayerBet(null);
    gameState.isSlowMotionRef.current = false;
    gameState.setShowConfetti(false);
    gameState.battleStatsRef.current = { startTime: 0, totalCollisions: 0, duration: 0 };
    entitiesRef.current = [];
    
    resetCombo(
      gameState.setCurrentCombo,
      gameState.setLastConversionType,
      gameState.comboTimeoutRef
    );
    gameState.setMaxCombo(0);
    gameState.setCounts({ rock: 0, paper: 0, scissors: 0 });
    gameState.setPrevCounts({ rock: 0, paper: 0, scissors: 0 });
    gameState.setBettingTimeLeft(GAME_CONFIG.BETTING_TIME);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };
  
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background to-accent/10 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-6xl mx-auto w-full">
        
        {/* Bet Screen */}
        {gameState.gamePhase === 'bet' && (
          <BetScreen
            onBet={handleBet}
            bettingTimeLeft={gameState.bettingTimeLeft}
            streak={gameState.streak}
            betConfetti={gameState.betConfetti}
          />
        )}
        
        {/* Countdown Overlay */}
        {gameState.countdown !== null && (
          <CountdownOverlay countdown={gameState.countdown} />
        )}
        
        {/* Running Phase */}
        {gameState.gamePhase === 'running' && (
          <div className="w-full space-y-2 sm:space-y-3">
            <GameHUD
              counts={gameState.counts}
              streak={gameState.streak}
              playerBet={gameState.playerBet}
            />
            
            <GameCanvas
              ref={canvasRef}
              arenaSize={gameState.arenaSize}
              touchParticles={gameState.touchParticles}
              onRemoveParticle={(id) => {
                gameState.setTouchParticles(prev => prev.filter(p => p.id !== id));
              }}
              wrapperRef={wrapperRef}
            />
            
            {/* Speed Control - Positioned below canvas */}
            {showSpeedControl && (
              <Card className="p-3 sm:p-4">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-sm font-medium font-mono" id="speedSlider">
                    Speed: {gameState.speed}x
                  </label>
                  <Slider
                    value={[gameState.speed]}
                    onValueChange={handleSpeedChange}
                    min={0.5}
                    max={5}
                    step={0.5}
                    aria-labelledby="speedSlider"
                  />
                </div>
              </Card>
            )}
          </div>
        )}
        
        {/* Victory Overlay */}
        {gameState.gamePhase === 'victory' && gameState.winner && (
          <VictoryScreen
            winner={gameState.winner}
            playerBet={gameState.playerBet}
            streak={gameState.streak}
            maxCombo={gameState.maxCombo}
            battleStats={gameState.battleStatsFinal}
            showConfetti={gameState.showConfetti}
            coinsEarned={progression.lastCoinsEarned}
            onPlayAgain={handlePlayAgain}
            onShowStats={() => setShowStatsPanel(true)}
            onShowAchievements={() => setShowAchievements(true)}
          />
        )}
      </div>
      
      {/* Combo Badge - Independent Overlay */}
      <ComboBadge 
        currentCombo={gameState.currentCombo}
        isVisible={gameState.gamePhase === 'running'}
      />
      {/* Coin Display - Always visible */}
      <CoinDisplay 
        coins={progression.stats.totalCoins}
        recentCoins={progression.recentCoins}
      />
      
      {/* Achievement Toasts */}
      {progression.newAchievements.slice(0, 3).map((achievement, index) => (
        <div 
          key={achievement.id}
          style={{ top: `${80 + index * 100}px` }}
        >
          <AchievementToast 
            achievement={achievement}
            onDismiss={progression.dismissAchievement}
          />
        </div>
      ))}
      
      {/* Stats Panel */}
      {showStatsPanel && (
        <StatsPanel 
          stats={progression.stats}
          onClose={() => setShowStatsPanel(false)}
        />
      )}
      
      {/* Achievements Grid */}
      {showAchievements && (
        <AchievementsGrid
          achievements={progression.achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
      
      {/* Audio Toggle - Always visible */}
      <AudioToggle 
        isMuted={gameState.isMuted}
        onToggle={handleToggleMute}
      />
      
      {/* Ad Playing Overlay */}
      {pokiSDK.isAdPlaying && (
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
