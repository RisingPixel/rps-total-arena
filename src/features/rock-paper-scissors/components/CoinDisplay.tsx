interface CoinDisplayProps {
  coins: number;
  recentCoins: number | null;
}

export const CoinDisplay = ({ coins, recentCoins }: CoinDisplayProps) => {
  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg">
      <span className="text-2xl">💰</span>
      <span className="font-mono font-bold text-lg text-foreground">{coins}</span>
      
      {recentCoins !== null && (
        <span className="absolute -top-8 right-0 text-sm font-bold text-green-500 animate-float-up">
          +{recentCoins}
        </span>
      )}
    </div>
  );
};
