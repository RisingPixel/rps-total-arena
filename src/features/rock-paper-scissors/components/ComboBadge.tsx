interface ComboBadgeProps {
  currentCombo: number;
  isVisible: boolean;
}

export const ComboBadge = ({ currentCombo, isVisible }: ComboBadgeProps) => {
  if (!isVisible || currentCombo < 3) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div 
        className="px-6 py-3 rounded-full font-bold text-2xl shadow-2xl animate-bounce whitespace-nowrap"
        style={{
          background: currentCombo >= 10 
            ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
            : currentCombo >= 7
            ? 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'
            : 'linear-gradient(135deg, #6BCB77 0%, #4D96FF 100%)',
          transform: `scale(${1 + currentCombo * 0.05})`,
          animation: currentCombo >= 10 ? 'pulse 0.5s infinite, bounce 1s infinite' : undefined
        }}
      >
        <span className="text-white drop-shadow-lg">
          x{currentCombo} COMBO! 🔥
        </span>
      </div>
    </div>
  );
};
