import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getThrowAnimation, type ThrowAnimationStyle } from "@/lib/animations";

interface ThrowAnimationPreviewProps {
  animationId: ThrowAnimationStyle;
}

// Dot positions for dice faces
const dotPositions: Record<number, string[]> = {
  1: ["center"],
  2: ["top-right", "bottom-left"],
  3: ["top-right", "center", "bottom-left"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"],
};

const positionClasses: Record<string, string> = {
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "top-left": "top-1.5 left-1.5",
  "top-right": "top-1.5 right-1.5",
  "middle-left": "top-1/2 left-1.5 -translate-y-1/2",
  "middle-right": "top-1/2 right-1.5 -translate-y-1/2",
  "bottom-left": "bottom-1.5 left-1.5",
  "bottom-right": "bottom-1.5 right-1.5",
};

const PreviewDiceDots = ({ value }: { value: number }) => {
  const positions = dotPositions[value] || [];
  return (
    <>
      {positions.map((pos, index) => (
        <div
          key={index}
          className={cn(
            "absolute w-2 h-2 rounded-full bg-foreground",
            positionClasses[pos]
          )}
        />
      ))}
    </>
  );
};

export const ThrowAnimationPreview = ({ animationId }: ThrowAnimationPreviewProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [key, setKey] = useState(0);

  // Auto-trigger animation loop
  useEffect(() => {
    const triggerAnimation = () => {
      setIsAnimating(true);
      setKey(prev => prev + 1);
      // Reset after animation completes
      setTimeout(() => setIsAnimating(false), 800);
    };

    // Initial trigger
    triggerAnimation();

    // Loop every 2.5 seconds
    const interval = setInterval(triggerAnimation, 2500);
    return () => clearInterval(interval);
  }, [animationId]);

  const diceValues = [3, 5, 6];
  const animationVariant = getThrowAnimation(animationId);

  const getLabel = () => {
    switch (animationId) {
      case "turbo_spin_throw":
        return "Turbo Spin 5x preview";
      case "bounce_drop_throw":
        return "Bounce Drop preview";
      default:
        return "Default throw preview";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {diceValues.map((value, index) => {
          const animation = isAnimating ? {
            rotate: animationVariant.rotate,
            scale: animationVariant.scale,
            filter: animationVariant.filter,
            transition: {
              duration: animationVariant.transition?.duration ?? 0.55,
              ease: animationVariant.transition?.ease ?? "easeInOut",
              delay: index * 0.05,
            },
          } : {};
          
          return (
            <motion.div
              key={`${key}-${index}`}
              className="relative w-10 h-10 rounded-lg border-2 bg-card border-border shadow-md"
              animate={animation}
            >
              <PreviewDiceDots value={value} />
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {getLabel()}
      </p>
    </div>
  );
};
