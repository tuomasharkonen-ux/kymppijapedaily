import {
  Flame,
  Baby,
  Cake,
  PartyPopper,
  TreeDeciduous,
  Share2,
  ArrowRight,
  Sparkles,
  Zap,
  Star,
  Crown,
  Gem,
  Medal,
  GraduationCap,
  Award,
  Swords,
  Target,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Calendar,
  CalendarDays,
  TrendingUp,
  Dices,
  type LucideIcon,
} from "lucide-react";

// Map badge IDs to appropriate Lucide icons
export const badgeIconMap: Record<string, LucideIcon> = {
  // Daily streak (repeatable)
  daily_streak: Flame,
  
  // First win
  first_win: Baby,
  
  // Winning number badges (1-6) - use dice icons
  win_1: Dice1,
  win_2: Dice2,
  win_3: Dice3,
  win_4: Dice4,
  win_5: Dice5,
  win_6: Dice6,
  
  // Streak milestones
  streak_10: Calendar,
  streak_30: CalendarDays,
  streak_50: TrendingUp,
  streak_100: Crown,
  streak_365: Gem,
  
  // Starter match badges
  starter_5: Sparkles,
  starter_6: Zap,
  starter_7: Star,
  starter_8: Crown,
  starter_9: Gem,
  
  // Throw count badges
  throws_6: Medal,
  throws_5: GraduationCap,
  throws_4: Award,
  throws_3: Swords,
  throws_2: Target,
  throws_1: Crown,
  
  // Special badges
  special_share: Share2,
  special_straight: ArrowRight,
  special_date_birthday: Cake,
  special_date_ny: PartyPopper,
  special_date_xmas: TreeDeciduous,
  
  // Collection badges
  jack_of_all_dice: Dices,
};

export const getBadgeIcon = (badgeId: string): LucideIcon => {
  return badgeIconMap[badgeId] || Award;
};
