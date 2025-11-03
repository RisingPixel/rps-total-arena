import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Achievement } from '../types/progression';

interface AchievementsGridProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsGrid = ({ achievements, onClose }: AchievementsGridProps) => {
  const categories = ['betting', 'combat', 'mastery', 'special'] as const;
  
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'betting': return '🎯 Betting';
      case 'combat': return '⚔️ Combat';
      case 'mastery': return '🏆 Mastery';
      case 'special': return '✨ Special';
      default: return category;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold font-mono">🏅 Achievements</h2>
            <p className="text-muted-foreground font-mono mt-1">
              {unlockedCount} / {achievements.length} Unlocked
            </p>
          </div>
          <Button onClick={onClose} variant="default">
            Close
          </Button>
        </div>

        {categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          
          return (
            <div key={category} className="space-y-3">
              <h3 className="text-xl font-bold font-mono">{getCategoryTitle(category)}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map(achievement => (
                  <Card
                    key={achievement.id}
                    className={`p-4 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary shadow-lg'
                        : 'bg-card/50 opacity-60 grayscale'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm mb-1 truncate">{achievement.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        
                        {!achievement.unlocked && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono">Progress</span>
                              <span className="font-mono">
                                {Math.min(achievement.progress, achievement.requirement)} / {achievement.requirement}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (achievement.progress / achievement.requirement) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs font-mono mt-2 text-primary">
                          <span>💰</span>
                          <span>{achievement.coinReward}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
