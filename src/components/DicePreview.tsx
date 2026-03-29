import { cn } from "@/lib/utils";
import type { DiceSkin } from "@/components/Dice";

interface DicePreviewProps {
  skin: DiceSkin;
}

// Skin-specific styles (same as Dice.tsx)
const skinStyles: Record<DiceSkin, { bg: string; border: string; dot: string; glow?: string }> = {
  default: {
    bg: "bg-card",
    border: "border-border",
    dot: "bg-foreground",
  },
  golden_dice: {
    bg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
    border: "border-amber-600",
    dot: "bg-amber-900",
    glow: "shadow-[0_0_15px_rgba(251,191,36,0.5)]",
  },
  diamond_dice: {
    bg: "bg-gradient-to-br from-cyan-200 via-blue-300 to-purple-300",
    border: "border-blue-400",
    dot: "bg-blue-900",
    glow: "shadow-[0_0_15px_rgba(147,197,253,0.6)]",
  },
  german_supermarket_dice: {
    bg: "bg-yellow-400",
    border: "border-red-600 border-[3px]",
    dot: "bg-blue-600",
  },
  sauna_dice: {
    bg: "bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300",
    border: "border-amber-700 border-[2px]",
    dot: "bg-amber-900",
    glow: "shadow-[0_0_12px_rgba(180,120,60,0.4)]",
  },
};

const PreviewDie = ({ value, skin }: { value: number; skin: DiceSkin }) => {
  const dotPositions: Record<number, string[]> = {
    1: ["center"],
    2: ["top-right", "bottom-left"],
    3: ["top-right", "center", "bottom-left"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
  };

  const positionClasses: Record<string, string> = {
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-left": "top-1 left-1",
    "top-right": "top-1 right-1",
    "middle-left": "top-1/2 left-1 -translate-y-1/2",
    "middle-right": "top-1/2 right-1 -translate-y-1/2",
    "bottom-left": "bottom-1 left-1",
    "bottom-right": "bottom-1 right-1",
  };

  const positions = dotPositions[value] || [];
  const styles = skinStyles[skin];

  return (
    <div
      className={cn(
        "relative w-10 h-10 rounded-lg border-2",
        styles.bg,
        styles.border,
        styles.glow
      )}
    >
      {positions.map((pos, index) => (
        <div
          key={index}
          className={cn(
            "absolute w-2 h-2 rounded-full",
            styles.dot,
            positionClasses[pos]
          )}
        />
      ))}
    </div>
  );
};

export const DicePreview = ({ skin }: DicePreviewProps) => {
  // Show a sample of dice with different values
  const sampleValues = [1, 3, 6];

  return (
    <div className="flex items-center justify-center gap-3">
      {sampleValues.map((value, index) => (
        <PreviewDie key={index} value={value} skin={skin} />
      ))}
    </div>
  );
};
