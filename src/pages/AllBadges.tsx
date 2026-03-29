 import { useState, useEffect } from "react";
 import { Link } from "react-router-dom";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
 import { BadgeModal } from "@/components/BadgeModal";
 import { useBadges, Badge } from "@/hooks/useBadges";
 import { getBadgeIcon } from "@/lib/badgeIcons";
 import { ArrowLeft } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 
 // Category definitions with display names and badge trigger types
 const badgeCategories: { id: string; name: string; emoji: string; triggerTypes: string[] }[] = [
   { 
     id: "streaks", 
     name: "Streaks", 
     emoji: "🔥", 
     triggerTypes: ["daily_streak"] 
   },
   { 
     id: "performance", 
     name: "Performance", 
     emoji: "⭐", 
     triggerTypes: ["personal_best", "under_par", "winning_throw_count"] 
   },
   { 
     id: "milestones", 
     name: "Milestones", 
     emoji: "🎯", 
     triggerTypes: ["total_games", "win_count_same", "all_numbers_won"] 
   },
   { 
     id: "starter", 
     name: "Lucky Starts", 
     emoji: "🍀", 
     triggerTypes: ["starter_match"] 
   },
   { 
     id: "special", 
     name: "Special Dates", 
     emoji: "📅", 
     triggerTypes: ["date_match"] 
   },
   { 
     id: "social", 
     name: "Social", 
     emoji: "👥", 
     triggerTypes: ["feature_used", "share_count"] 
   },
   { 
     id: "shop", 
     name: "Shop & Collection", 
     emoji: "🛒", 
     triggerTypes: ["first_purchase", "skin_collection"] 
   },
   { 
     id: "gameplay", 
     name: "Gameplay", 
     emoji: "🎲", 
     triggerTypes: ["action_win", "locked_numbers", "repeat_win"] 
   },
 ];
 
 const rarityStyles: Record<string, string> = {
   Common: "border-muted-foreground/30 bg-muted/30 hover:bg-muted/50",
   Uncommon: "border-green-500/30 bg-green-500/10 hover:bg-green-500/20",
   Rare: "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20",
   Epic: "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20",
   Legendary: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
 };
 
 const rarityTextColors: Record<string, string> = {
   Common: "text-muted-foreground",
   Uncommon: "text-green-600 dark:text-green-400",
   Rare: "text-blue-600 dark:text-blue-400",
   Epic: "text-purple-600 dark:text-purple-400",
   Legendary: "text-amber-600 dark:text-amber-400",
 };
 
 const lockedStyles = "border-muted/50 bg-muted/20 opacity-50 cursor-default";
 const lockedTextColor = "text-muted-foreground/60";
 
 export default function AllBadges() {
   const [userId, setUserId] = useState<string | null>(null);
   const { allBadges, userBadges, isLoading } = useBadges(userId);
   const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
   const [selectedEarnedAt, setSelectedEarnedAt] = useState<string | null>(null);
 
   useEffect(() => {
     const getUser = async () => {
       const { data } = await supabase.auth.getUser();
       setUserId(data.user?.id || null);
     };
     getUser();
   }, []);
 
   // Create a set of earned badge IDs for quick lookup
   const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
   
   // Find earned_at for a badge
   const getEarnedAt = (badgeId: string) => {
     const userBadge = userBadges.find((ub) => ub.badge_id === badgeId);
     return userBadge?.earned_at || null;
   };
 
   const handleBadgeClick = (badge: Badge) => {
     if (earnedBadgeIds.has(badge.id)) {
       setSelectedBadge(badge);
       setSelectedEarnedAt(getEarnedAt(badge.id));
     }
   };
 
   // Group badges by category
   const getBadgesForCategory = (triggerTypes: string[]) => {
     return allBadges.filter((badge) => triggerTypes.includes(badge.trigger_type));
   };
 
   if (isLoading) {
     return (
       <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
         <div className="flex items-center gap-2">
           <Skeleton className="h-10 w-10" />
           <Skeleton className="h-8 w-48" />
         </div>
         {[1, 2, 3].map((i) => (
           <Card key={i}>
             <CardHeader>
               <Skeleton className="h-6 w-32" />
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                 {[1, 2, 3, 4].map((j) => (
                   <Skeleton key={j} className="aspect-square rounded-lg" />
                 ))}
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     );
   }
 
   const earnedCount = userBadges.length;
   const totalCount = allBadges.length;
 
   return (
     <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
       {/* Header */}
       <div className="flex items-center gap-3">
         <Link to="/">
           <Button variant="ghost" size="icon" aria-label="Back to home">
             <ArrowLeft className="h-5 w-5" />
           </Button>
         </Link>
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <span aria-hidden="true">🏆</span> All Badges
           </h1>
           <p className="text-sm text-muted-foreground">
             {earnedCount} of {totalCount} badges earned
           </p>
         </div>
       </div>
 
       {/* Categories */}
       {badgeCategories.map((category) => {
         const badges = getBadgesForCategory(category.triggerTypes);
         if (badges.length === 0) return null;
 
         return (
           <Card key={category.id}>
             <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center gap-2">
                 <span aria-hidden="true">{category.emoji}</span> {category.name}
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                 {badges.map((badge) => {
                   const isEarned = earnedBadgeIds.has(badge.id);
                   const rarity = badge.rarity;
                   const styles = isEarned
                     ? rarityStyles[rarity] || rarityStyles.Common
                     : lockedStyles;
                   const textColor = isEarned
                     ? rarityTextColors[rarity] || rarityTextColors.Common
                     : lockedTextColor;
                   const IconComponent = getBadgeIcon(badge.id);
 
                   return (
                     <button
                       key={badge.id}
                       onClick={() => handleBadgeClick(badge)}
                       disabled={!isEarned}
                       aria-label={
                         isEarned
                           ? `${badge.name} badge, ${badge.rarity} rarity. Click for details.`
                           : `${badge.name} badge, not yet earned.`
                       }
                       className={`aspect-square rounded-lg border-2 p-2.5 min-w-[70px] min-h-[70px] flex flex-col items-center justify-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${styles} ${isEarned ? "cursor-pointer" : ""}`}
                     >
                       <IconComponent
                         className={`w-5 h-5 md:w-6 md:h-6 ${textColor}`}
                         aria-hidden="true"
                       />
                       <span
                         className={`text-[10px] font-medium w-full text-center leading-tight line-clamp-2 ${textColor}`}
                         aria-hidden="true"
                       >
                         {badge.name}
                       </span>
                     </button>
                   );
                 })}
               </div>
             </CardContent>
           </Card>
         );
       })}
 
       <BadgeModal
         badge={selectedBadge}
         earnedAt={selectedEarnedAt}
         isOpen={!!selectedBadge}
         onClose={() => {
           setSelectedBadge(null);
           setSelectedEarnedAt(null);
         }}
       />
     </div>
   );
 }