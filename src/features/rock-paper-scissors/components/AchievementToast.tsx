import { Achievement } from '../types/progression';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: (id: string) => void;
}

export const AchievementToast = ({ achievement, onDismiss }: AchievementToastProps) => {
  return (
    <div 
      className="fixed top-20 right-4 z-50 bg-gradient-to-r from-primary/90 to-accent/90 backdrop-blur-sm text-primary-foreground px-6 py-4 rounded-lg border-2 border-primary shadow-2xl animate-achievement-pulse max-w-xs"
      onClick={() => onDismiss(achievement.id)}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span className="text-4xl">{achievement.icon}</span>
        <div className="flex-1">
          <div className="font-bold text-sm mb-1">🎉 Achievement Unlocked!</div>
          <div className="font-bold text-base">{achievement.name}</div>
          <div className="text-xs opacity-90 mt-1">{achievement.description}</div>
          <div className="text-xs font-mono mt-2 flex items-center gap-1">
            <span>💰</span>
            <span>+{achievement.coinReward} coins</span>
          </div>
        </div>
      </div>
    </div>
  );
};
