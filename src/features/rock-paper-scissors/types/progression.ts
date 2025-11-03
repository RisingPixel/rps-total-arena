export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  correctBets: number;
  totalComebacks: number;
  totalCoins: number;
  totalCollisions: number;
  totalCombos: number;
  bestStreak: number;
  fastestWin: number; // seconds
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'betting' | 'combat' | 'mastery' | 'special';
  coinReward: number;
  unlocked: boolean;
  progress: number;
}

export interface CoinTransaction {
  amount: number;
  reason: string;
  timestamp: number;
}
