import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Lock, HelpCircle, Wind } from "lucide-react";

export type DiceSkin = "default" | "golden_dice" | "diamond_dice" | "german_supermarket_dice";
export type DiceAnimationType = 'shake' | 'blow' | null;

interface DiceProps {
  value: number;
  isLocked: boolean;
  isRolling: boolean;
  onClick: () => void;
  disabled?: boolean;
  skin?: DiceSkin;
  isScrambled?: boolean;
  animationType?: DiceAnimationType;
}


// Skin-specific styles
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
    bg: "bg-gradient-to-br from-yellow-400 via-blue-500 to-red-500",
    border: "border-yellow-500",
    dot: "bg-white",
  },
};

const DiceDotsWithSkin = ({ value, skin = "default" }: { value: number; skin?: DiceSkin }) => {
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
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "middle-left": "top-1/2 left-2 -translate-y-1/2",
    "middle-right": "top-1/2 right-2 -translate-y-1/2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2",
  };

  const positions = value > 0 ? (dotPositions[value] || []) : [];
  const dotColor = skinStyles[skin].dot;

  return (
    <>
      {positions.map((pos, index) => (
        <div
          key={index}
          className={cn(
            "absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full",
            dotColor,
            positionClasses[pos]
          )}
        />
      ))}
    </>
  );
};

// Scrambled state placeholder - shows "?" or wind icon
const ScrambledPlaceholder = ({ type, skin = "default" }: { type: 'shake' | 'blow' | null; skin?: DiceSkin }) => {
  const iconColor = skinStyles[skin].dot;
  const IconComponent = type === 'blow' ? Wind : HelpCircle;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center animate-scramble-pulse">
      <IconComponent 
        className={cn(
          "w-6 h-6 md:w-8 md:h-8",
          iconColor.replace('bg-', 'text-').replace('foreground', 'foreground')
        )} 
      />
    </div>
  );
};

export const Dice = ({ 
  value, 
  isLocked, 
  isRolling, 
  onClick, 
  disabled, 
  skin = "default",
  isScrambled = false,
  animationType = null
}: DiceProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [lastScrambleType, setLastScrambleType] = useState<'shake' | 'blow' | null>(null);

  // Track the last action type for showing appropriate placeholder
  useEffect(() => {
    if (animationType) {
      setLastScrambleType(animationType);
    }
  }, [animationType]);

  useEffect(() => {
    if (isRolling) {
      const tumbleInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 50);

      const timeout = setTimeout(() => {
        clearInterval(tumbleInterval);
        setDisplayValue(value);
      }, 550);

      return () => {
        clearInterval(tumbleInterval);
        clearTimeout(timeout);
      };
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, value]);

  const styles = skinStyles[skin];
  
  // Determine which animation class to apply
  const getAnimationClass = () => {
    if (isRolling) return "animate-dice-roll";
    if (animationType === 'shake' && !isLocked) return "animate-dice-shake-intense";
    if (animationType === 'blow' && !isLocked) return "animate-dice-blow";
    return "";
  };

  // Show scrambled state only for unlocked dice
  const showScrambled = isScrambled && !isLocked && !isRolling;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isRolling}
      aria-label={`Die ${value > 0 ? `showing ${value}` : 'not rolled'}, ${isLocked ? 'locked' : 'unlocked'}${isScrambled ? ', scrambled' : ''}. Click to ${isLocked ? 'unlock' : 'lock'}.`}
      aria-pressed={isLocked}
      className={cn(
        "relative w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-md transition-transform duration-300",
        styles.bg,
        "border-2",
        isLocked 
          ? "border-primary ring-2 ring-primary/50 animate-pulse-glow" 
          : styles.border + " hover:border-primary/50",
        styles.glow,
        getAnimationClass(),
        !isRolling && !disabled && "hover:scale-105 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {showScrambled ? (
        <ScrambledPlaceholder type={lastScrambleType} skin={skin} />
      ) : (
        <DiceDotsWithSkin value={displayValue} skin={skin} />
      )}
      {isLocked && (
        <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center">
          <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
};
