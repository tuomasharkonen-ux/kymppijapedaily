import React from "react";
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
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DicePreview } from "./DicePreview";
import { ActionPreview } from "./ActionPreview";
import {
  CalendarDays,
  Award,
  ShoppingBag,
  Trophy,
  Flame,
  TrendingUp,
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
    icon: <CalendarDays className="h-8 w-8 text-primary" />,
    title: "Daily Challenge",
    badge: "Core Feature",
    description:
      "A fresh new game awaits you every day at midnight! Each day brings the same starting dice for all players, creating a fair competition. Your goal: lock all 10 dice on the same number in as few throws as possible.",
    preview: (
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex gap-1">
          {[1, 1, 1, 3, 1, 1, 2, 1, 1, 1].map((v, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                v === 1
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground"
              }`}
            >
              {v}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Lock matching dice to win!</p>
      </div>
    ),
  },
  {
    id: "badges",
    icon: <Award className="h-8 w-8 text-primary" />,
    title: "Achievement Badges",
    badge: "Earn Credits",
    badgeVariant: "secondary",
    description:
      "Unlock over 20 unique badges by playing skillfully! Earn credits for each badge you collect. From streak masters to lucky number hunters, there's a badge for every playstyle. Can you collect them all?",
    preview: (
      <div className="flex flex-wrap items-center justify-center gap-2 py-4">
        {[
          { name: "First Win", rarity: "common" },
          { name: "Hot Streak", rarity: "uncommon" },
          { name: "Lucky 7", rarity: "rare" },
          { name: "Legendary", rarity: "legendary" },
        ].map((badge) => (
          <div
            key={badge.name}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
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
    icon: <ShoppingBag className="h-8 w-8 text-primary" />,
    title: "Dice Pro Shop",
    badge: "Spend Credits",
    badgeVariant: "secondary",
    description:
      "Spend your hard-earned credits in the Dice Pro Shop! Unlock premium dice skins like Golden Dice or Diamond Dice, and fun actions like Shake and Blow. Customize your game and roll in style!",
    preview: (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <DicePreview skin="golden_dice" />
            <p className="text-[10px] text-muted-foreground mt-1">Golden</p>
          </div>
          <div className="text-center">
            <DicePreview skin="diamond_dice" />
            <p className="text-[10px] text-muted-foreground mt-1">Diamond</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    icon: <span className="text-3xl">🫨</span>,
    title: "Dice Actions",
    badge: "Fun Rituals",
    description:
      "Unlock special pre-roll rituals! Shake your dice vigorously or blow on them for good luck before each throw. While scientifically proven to do nothing, they're essential for any serious dice roller.",
    preview: (
      <div className="flex items-center justify-center gap-6 py-2">
        <div className="text-center">
          <ActionPreview actionId="shake_dice_action" />
        </div>
        <div className="text-center">
          <ActionPreview actionId="blow_dice_action" />
        </div>
      </div>
    ),
  },
  {
    id: "leaderboard",
    icon: <Trophy className="h-8 w-8 text-primary" />,
    title: "Global Leaderboard",
    badge: "Compete",
    description:
      "See how you stack up against players worldwide! Track your ranking by best score or average throws. Climb the leaderboard and prove you're the ultimate Kymppijape champion!",
    preview: (
      <div className="space-y-1.5 py-2 w-full max-w-[200px] mx-auto">
        {[
          { rank: 1, name: "DiceMaster", score: "6.2" },
          { rank: 2, name: "LuckyRoller", score: "7.1" },
          { rank: 3, name: "You?", score: "—" },
        ].map((player) => (
          <div
            key={player.rank}
            className={`flex items-center justify-between px-3 py-1.5 rounded text-xs ${
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
    icon: <Flame className="h-8 w-8 text-primary" />,
    title: "Daily Streaks",
    badge: "Stay Consistent",
    description:
      "Build and maintain your daily playing streak! Play every day to keep your streak alive and unlock streak-based badges. How many consecutive days can you keep the dice rolling?",
    preview: (
      <div className="flex items-center justify-center gap-1 py-4">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div
            key={day}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              day <= 5
                ? "bg-primary text-primary-foreground"
                : day === 6
                ? "bg-primary/30 text-primary border-2 border-dashed border-primary"
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
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    title: "Personal Stats",
    badge: "Track Progress",
    description:
      "Detailed statistics about your gameplay! Track your personal best, worst, and average throws. See your favorite winning number and monitor your improvement over time.",
    preview: (
      <div className="grid grid-cols-3 gap-2 py-2 w-full max-w-[220px] mx-auto">
        {[
          { label: "Best", value: "7", icon: "🏆" },
          { label: "Average", value: "12.4", icon: "📊" },
          { label: "Games", value: "42", icon: "🎲" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center bg-muted/50 rounded-lg py-2 px-1"
          >
            <div className="text-lg font-bold">{stat.value}</div>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span aria-hidden="true">🎲</span> Explore Features
          </DialogTitle>
          <DialogDescription className="text-center">
            Discover everything Kymppijape has to offer
          </DialogDescription>
        </DialogHeader>

        <Carousel className="w-full px-8">
          <CarouselContent>
            {features.map((feature) => (
              <CarouselItem key={feature.id}>
                <Card className="border-0 shadow-none">
                  <CardContent className="flex flex-col items-center p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {feature.icon}
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                    </div>
                    {feature.badge && (
                      <Badge variant={feature.badgeVariant || "default"}>
                        {feature.badge}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="w-full min-h-[80px] flex items-center justify-center">
                      {feature.preview}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>

        <div className="flex justify-center gap-1 pt-2">
          {features.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
