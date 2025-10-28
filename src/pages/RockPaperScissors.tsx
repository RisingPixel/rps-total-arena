import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

type EntityType = "rock" | "paper" | "scissors";

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

const RockPaperScissors = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<EntityType | null>(null);
  
  // Configuration state
  const [rockCount, setRockCount] = useState(20);
  const [paperCount, setPaperCount] = useState(20);
  const [scissorsCount, setScissorsCount] = useState(20);
  const [speed, setSpeed] = useState(2);
  const [arenaSize, setArenaSize] = useState(600);
  
  // Live counters
  const [counts, setCounts] = useState({ rock: 0, paper: 0, scissors: 0 });
  
  const entitiesRef = useRef<Entity[]>([]);
  const animationFrameRef = useRef<number>();

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

  const animate = () => {
    if (!canvasRef.current || isPaused) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
          }
          if (winner !== entities[j].type) {
            entities[j].type = winner;
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
    setCounts(newCounts);
    
    const types = Object.keys(newCounts).filter((type) => newCounts[type as EntityType] > 0);
    if (types.length === 1 && entities.length > 0) {
      setWinner(types[0] as EntityType);
      setIsRunning(false);
    }
    
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };


  useEffect(() => {
    if (isRunning && !isPaused) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && isRunning) {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRunning, isPaused]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-foreground font-mono">
            Rock Paper Scissors Live
          </h1>
          <p className="text-lg text-muted-foreground font-mono">
            Who will dominate the arena?
          </p>
        </div>

        {/* Configuration Panel */}
        {!isRunning && (
          <Card id="configPanel" className="p-6 space-y-6 shadow-lg">
            <h2 className="text-xl font-semibold font-mono">Configuration</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono flex items-center gap-2">
                  🪨 Rocks: {rockCount}
                </label>
                <Slider
                  value={[rockCount]}
                  onValueChange={(v) => setRockCount(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono flex items-center gap-2">
                  📜 Papers: {paperCount}
                </label>
                <Slider
                  value={[paperCount]}
                  onValueChange={(v) => setPaperCount(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono flex items-center gap-2">
                  ✂️ Scissors: {scissorsCount}
                </label>
                <Slider
                  value={[scissorsCount]}
                  onValueChange={(v) => setScissorsCount(v[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium font-mono">
                  Speed: {speed}x
                </label>
                <Slider
                  value={[speed]}
                  onValueChange={(v) => setSpeed(v[0])}
                  min={0.5}
                  max={5}
                  step={0.5}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium font-mono">
                  Arena Size: {arenaSize}px
                </label>
                <Slider
                  value={[arenaSize]}
                  onValueChange={(v) => setArenaSize(v[0])}
                  min={400}
                  max={800}
                  step={50}
                />
              </div>
            </div>
            
            <Button
              id="startBtn"
              onClick={() => {
                if (rockCount + paperCount + scissorsCount > 200) {
                  alert("Maximum 200 entities allowed!");
                  return;
                }
                
                setWinner(null);
                setIsRunning(true);
                setIsPaused(false);
                initializeEntities();
              }}
              className="w-full font-mono text-lg"
              size="lg"
            >
              Start Simulation
            </Button>
          </Card>
        )}

        {/* Canvas and Controls */}
        {isRunning && (
          <div className="space-y-4">
            {/* Live Counter */}
            <Card id="counter" className="p-4">
              <div className="flex justify-around items-center font-mono text-lg">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🪨</span>
                  <span className="font-bold">{counts.rock}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">📜</span>
                  <span className="font-bold">{counts.paper}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">✂️</span>
                  <span className="font-bold">{counts.scissors}</span>
                </div>
              </div>
            </Card>

            {/* Canvas */}
            <div className="flex justify-center">
              <canvas
                id="canvas"
                ref={canvasRef}
                width={arenaSize}
                height={arenaSize}
                className="border-4 border-border rounded-lg shadow-lg bg-slate-50"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => {
                  if (isRunning) {
                    setIsPaused(!isPaused);
                  }
                }}
                variant="secondary"
                className="font-mono"
                size="lg"
              >
                {isPaused ? "Resume [Space]" : "Pause [Space]"}
              </Button>
              <Button
                id="resetBtn"
                onClick={() => {
                  setIsRunning(false);
                  setIsPaused(false);
                  setWinner(null);
                  entitiesRef.current = [];
                  setCounts({ rock: 0, paper: 0, scissors: 0 });
                  
                  if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    if (ctx) {
                      ctx.fillStyle = "#f8fafc";
                      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                  }
                }}
                variant="outline"
                className="font-mono"
                size="lg"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Winner Message */}
        {winner && (
          <Card id="winner" className="p-8 text-center space-y-4 shadow-lg animate-fade-in">
            <div className="text-6xl">{EMOJI_MAP[winner]}</div>
            <h2 className="text-3xl font-bold font-mono">
              {winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!
            </h2>
            <p className="text-lg text-muted-foreground font-mono">
              Total domination achieved
            </p>
            <Button
              onClick={() => {
                setIsRunning(false);
                setIsPaused(false);
                setWinner(null);
                entitiesRef.current = [];
                setCounts({ rock: 0, paper: 0, scissors: 0 });
                
                if (canvasRef.current) {
                  const ctx = canvasRef.current.getContext("2d");
                  if (ctx) {
                    ctx.fillStyle = "#f8fafc";
                    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  }
                }
              }}
              size="lg"
              className="font-mono"
            >
              Play Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RockPaperScissors;
