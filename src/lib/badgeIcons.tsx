import type { ComponentType } from "react";
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
  Hand,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { sieniFaceIcons } from "@/components/Dice";

// A badge icon can be a Lucide icon OR an <img> (for the mushroom badges).
// Both accept className / aria-hidden, so call sites need no changes.
export type BadgeIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

// Mushroom (Suomen Sienet) face badges → their actual mushroom photo
const sieniBadgeImages: Record<string, string> = {
  sieni_win_kantarelli: sieniFaceIcons[1],
  sieni_win_suppilovahvero: sieniFaceIcons[2],
  sieni_win_herkkutatti: sieniFaceIcons[3],
  sieni_win_korvasieni: sieniFaceIcons[4],
  sieni_win_mustatorvisieni: sieniFaceIcons[5],
  sieni_win_karpassieni: sieniFaceIcons[6],
};

const makeImageIcon = (src: string): BadgeIcon => {
  const ImageIcon: BadgeIcon = ({ className, ...rest }) => (
    <img src={src} alt="" draggable={false} className={cn("object-contain", className)} {...rest} />
  );
  return ImageIcon;
};

// Precompute stable components so they don't remount on every render
const sieniBadgeIcons: Record<string, BadgeIcon> = Object.fromEntries(
  Object.entries(sieniBadgeImages).map(([id, src]) => [id, makeImageIcon(src)])
);

import napalmSvg from "@/assets/helldivers/napalm.svg";
import bastionSvg from "@/assets/helldivers/bastion.svg";
import autocannonSvg from "@/assets/helldivers/autocannon.svg";
import hellbombSvg from "@/assets/helldivers/hellbomb.svg";
import eagle500Svg from "@/assets/helldivers/eagle500.svg";
import laserSvg from "@/assets/helldivers/laser.svg";

const makeSvgIcon = (src: string, alt: string): BadgeIcon => {
  const Icon: BadgeIcon = ({ className }) => (
    <img src={src} alt={alt} aria-hidden="true" className={className} />
  );
  Icon.displayName = `SvgBadgeIcon(${alt})`;
  return Icon;
};

const NapalmIcon = makeSvgIcon(napalmSvg, "Orbital Napalm Barrage");
const BastionIcon = makeSvgIcon(bastionSvg, "Bastion MK XVI");
const AutocannonIcon = makeSvgIcon(autocannonSvg, "Autocannon Sentry");
const HellbombIcon = makeSvgIcon(hellbombSvg, "Hellbomb");
const Eagle500Icon = makeSvgIcon(eagle500Svg, "Eagle 500KG Bomb");
const LaserIcon = makeSvgIcon(laserSvg, "Orbital Laser");

// Map badge IDs to appropriate icons (Lucide or custom SVG components).
export const badgeIconMap: Record<string, BadgeIcon> = {
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

  // Mushroom (Suomen Sienet) master badge — capstone for collecting all six.
  // The six per-mushroom badges use their actual photos (see sieniBadgeIcons).
  sieni_master: Trophy,

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
  
  // Action badges
  action_hero: Hand,

  // Helldivers stratagem badges
  helldivers_napalm: NapalmIcon,
  helldivers_bastion: BastionIcon,
  helldivers_autocannon: AutocannonIcon,
  helldivers_hellbomb: HellbombIcon,
  helldivers_eagle500: Eagle500Icon,
  helldivers_laser: LaserIcon,
  helldivers_master: Crown,
};

export const getBadgeIcon = (badgeId: string): BadgeIcon => {
  return sieniBadgeIcons[badgeId] || badgeIconMap[badgeId] || (Award as BadgeIcon);
};
