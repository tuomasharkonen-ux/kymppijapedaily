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
  Heart,
  Clover,
  Ghost,
  Skull,
  Snowflake,
  Sun,
  ShoppingBag,
  Palette,
  Paintbrush,
  Repeat,
  Hash,
  Trophy,
  TrendingDown,
  Gamepad2,
  Users,
  Megaphone,
  Rocket,
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
  streak_3: Calendar,
  streak_7: CalendarDays,
  streak_10: Calendar,
  streak_30: CalendarDays,
  streak_50: TrendingUp,
  streak_100: Crown,
  streak_200: Rocket,
  streak_365: Gem,
  
  // Starter match badges
  starter_5: Sparkles,
  starter_6: Zap,
  starter_7: Star,
  starter_8: Crown,
  starter_9: Gem,
  starter_10: Crown, // Perfect Start - Legendary
  
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
  
  // New holiday badges
  special_date_valentine: Heart,
  special_date_stpatrick: Clover,
  special_date_halloween: Ghost,
  special_date_friday13: Skull,
  special_date_leap: Calendar,
  special_date_summer: Sun,
  special_date_winter: Snowflake,
  
  // Collection badges
  jack_of_all_dice: Dices,
  
  // Social badges
  share_5: Users,
  share_10: Megaphone,
  
  // Shop badges
  first_purchase: ShoppingBag,
  skin_collector_3: Palette,
  skin_collector_5: Paintbrush,
  
  // Consistency badges
  groundhog_day: Repeat,
  lucky_number: Hash,
  master_of_one: Target,
  
  // Performance badges
  under_par: TrendingDown,
  personal_record: Trophy,
  
  // Milestone badges (games played)
  games_10: Gamepad2,
  games_50: Medal,
  games_100: Trophy,
  games_365: Crown,
  games_1000: Gem,
};

export const getBadgeIcon = (badgeId: string): LucideIcon => {
  return badgeIconMap[badgeId] || Award;
};
