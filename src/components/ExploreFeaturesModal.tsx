import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DicePreview } from "./DicePreview";
import { ActionPreview } from "./ActionPreview";
import {
  CalendarDays,
  Award,
  ShoppingBag,
  Trophy,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ExploreFeaturesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeatureSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  description: string;
  preview: React.ReactNode;
}

const features: FeatureSlide[] = [
  {
    id: "daily-challenge",
    icon: <CalendarDays className="h-6 w-6 text-primary" />,
    title: "Daily Challenge",
    badge: "Core Feature",
    description:
      "A fresh game awaits every day at midnight! Same starting dice for all players. Lock all 10 dice on the same number in as few throws as possible.",
    preview: (
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="flex gap-0.5">
          {[1, 1, 1, 3, 1, 1, 2, 1, 1, 1].map((v, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold ${
                v === 1
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {v}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">Lock matching dice to win!</p>
      </div>
    ),
  },
  {
    id: "badges",
    icon: <Award className="h-6 w-6 text-primary" />,
    title: "Achievement Badges",
    badge: "Earn Credits",
    badgeVariant: "secondary",
    description:
      "Unlock 20+ unique badges by playing skillfully! Earn credits for each badge. From streak masters to lucky number hunters.",
    preview: (
      <div className="flex flex-wrap items-center justify-center gap-1.5 py-2">
        {[
          { name: "First Win", rarity: "common" },
          { name: "Hot Streak", rarity: "uncommon" },
          { name: "Lucky 7", rarity: "rare" },
          { name: "Legendary", rarity: "legendary" },
        ].map((badge) => (
          <div
            key={badge.name}
            className={`px-2 py-1 rounded-full text-[10px] font-medium border ${
              badge.rarity === "common"
                ? "bg-gray-100 border-gray-300 text-gray-700"
                : badge.rarity === "uncommon"
                ? "bg-green-100 border-green-400 text-green-700"
                : badge.rarity === "rare"
                ? "bg-blue-100 border-blue-400 text-blue-700"
                : "bg-amber-100 border-amber-400 text-amber-700"
            }`}
          >
            {badge.name}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "shop",
    icon: <ShoppingBag className="h-6 w-6 text-primary" />,
    title: "Dice Pro Shop",
    badge: "Spend Credits",
    badgeVariant: "secondary",
    description:
      "Spend credits in the Shop! Unlock premium dice skins like Golden or Diamond Dice, and fun actions like Shake and Blow.",
    preview: (
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="text-center">
          <DicePreview skin="golden_dice" />
          <p className="text-[10px] text-muted-foreground mt-1">Golden</p>
        </div>
        <div className="text-center">
          <DicePreview skin="diamond_dice" />
          <p className="text-[10px] text-muted-foreground mt-1">Diamond</p>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    icon: <span className="text-2xl">🫨</span>,
    title: "Dice Actions",
    badge: "Fun Rituals",
    description:
      "Unlock special pre-roll rituals! Shake or blow on your dice for good luck. Scientifically proven to do nothing, but essential!",
    preview: (
      <div className="flex items-center justify-center gap-4 py-2">
        <ActionPreview actionId="shake_dice_action" />
      </div>
    ),
  },
  {
    id: "leaderboard",
    icon: <Trophy className="h-6 w-6 text-primary" />,
    title: "Global Leaderboard",
    badge: "Compete",
    description:
      "See how you stack up against players worldwide! Track your ranking by best score or average throws.",
    preview: (
      <div className="space-y-1 py-2 w-full max-w-[180px] mx-auto">
        {[
          { rank: 1, name: "DiceMaster", score: "6.2" },
          { rank: 2, name: "LuckyRoller", score: "7.1" },
          { rank: 3, name: "You?", score: "—" },
        ].map((player) => (
          <div
            key={player.rank}
            className={`flex items-center justify-between px-2 py-1 rounded text-[10px] ${
              player.rank === 3
                ? "bg-primary/10 border border-primary/30"
                : "bg-muted/50"
            }`}
          >
            <span className="font-medium">
              #{player.rank} {player.name}
            </span>
            <span className="text-muted-foreground">avg {player.score}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "streaks",
    icon: <Flame className="h-6 w-6 text-primary" />,
    title: "Daily Streaks",
    badge: "Stay Consistent",
    description:
      "Build and maintain your daily streak! Play every day to keep it alive and unlock streak-based badges.",
    preview: (
      <div className="flex items-center justify-center gap-1 py-2">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div
            key={day}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              day <= 5
                ? "bg-primary text-primary-foreground"
                : day === 6
                ? "bg-primary/30 text-primary border border-dashed border-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {day <= 5 ? "✓" : day}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "stats",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    title: "Personal Stats",
    badge: "Track Progress",
    description:
      "Detailed statistics about your gameplay! Track your personal best, average throws, and improvement over time.",
    preview: (
      <div className="grid grid-cols-3 gap-2 py-2 w-full max-w-[200px] mx-auto">
        {[
          { label: "Best", value: "7" },
          { label: "Average", value: "12.4" },
          { label: "Games", value: "42" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center bg-muted/50 rounded-lg py-1.5 px-1"
          >
            <div className="text-base font-bold">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>
    ),
  },
];

export const ExploreFeaturesModal = ({
  open,
  onOpenChange,
}: ExploreFeaturesModalProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);
  const scrollTo = useCallback((index: number) => api?.scrollTo(index), [api]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-base sm:text-lg">
            <span aria-hidden="true">🎲</span> Explore Features
          </DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            Swipe to discover what Kymppijape offers
          </DialogDescription>
        </DialogHeader>

        <Carousel 
          className="w-full" 
          setApi={setApi}
          opts={{ loop: true }}
        >
          <CarouselContent>
            {features.map((feature) => (
              <CarouselItem key={feature.id}>
                <Card className="border-0 shadow-none">
                  <CardContent className="flex flex-col items-center p-2 sm:p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {feature.icon}
                      <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                    </div>
                    {feature.badge && (
                      <Badge variant={feature.badgeVariant || "default"} className="text-[10px]">
                        {feature.badge}
                      </Badge>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed px-2">
                      {feature.description}
                    </p>
                    <div className="w-full min-h-[70px] flex items-center justify-center">
                      {feature.preview}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Navigation controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={scrollPrev}
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to feature ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={scrollNext}
            aria-label="Next feature"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slide counter */}
        <p className="text-center text-[10px] text-muted-foreground">
          {current + 1} of {features.length}
        </p>
      </DialogContent>
    </Dialog>
  );
};
