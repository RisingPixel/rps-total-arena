import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayerStats } from '../types/progression';

interface StatsPanelProps {
  stats: PlayerStats;
  onClose: () => void;
}

export const StatsPanel = ({ stats, onClose }: StatsPanelProps) => {
  const winRate = stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-mono">📊 Your Stats</h2>
          <Button onClick={onClose} variant="default">
            Close
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-primary font-mono">{stats.totalGames}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Total Games</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-green-500 font-mono">{winRate}%</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Win Rate</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-primary font-mono">{stats.wins}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Victories</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-destructive font-mono">{stats.losses}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Defeats</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-orange-500 font-mono">{stats.bestStreak}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Best Streak</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-primary font-mono">{stats.totalCoins}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Total Coins</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-primary font-mono">{stats.totalCollisions}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Collisions</div>
          </div>

          <div className="bg-card/50 rounded-lg p-4 border border-border text-center">
            <div className="text-3xl font-bold text-primary font-mono">
              {stats.fastestWin === Infinity ? '--' : `${stats.fastestWin}s`}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">Fastest Win</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
