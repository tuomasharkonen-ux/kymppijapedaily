import React, { useState, useCallback, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DicePreview } from "./DicePreview";
import { ActionPreview } from "./ActionPreview";
import {
  Award,
  ShoppingBag,
  Trophy,
  Flame,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface FeatureSlide {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  preview: React.ReactNode;
}

const features: FeatureSlide[] = [
  {
    id: "badges",
    icon: <Award className="h-6 w-6 text-primary" />,
    title: "Achievement Badges",
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
                : "bg-muted/50 text-muted-foreground"
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

export const FeaturesCarousel = () => {
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
    <div className="w-full">
      <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {features.map((feature) => (
            <CarouselItem key={feature.id} className="pl-0">
              <Card className="border-0 shadow-none">
                <CardContent className="flex flex-col items-center p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {feature.icon}
                    <h3 className="font-semibold text-base">{feature.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
                    {feature.description}
                  </p>
                  <div className="w-full min-h-[60px] flex items-center justify-center">
                    {feature.preview}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Navigation controls */}
      <div className="flex items-center justify-between pt-1">
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
              className={`h-2 w-2 rounded-full transition-colors ${
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
    </div>
  );
};

export { features };
