import { useState, useEffect } from "react";
import { HelpCircle, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionPreviewProps {
  actionId: "shake_dice_action" | "blow_dice_action";
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

export const ActionPreview = ({ actionId }: ActionPreviewProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-trigger animation loop
  useEffect(() => {
    const triggerAnimation = () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 800);
    };

    // Initial trigger
    triggerAnimation();

    // Loop every 2.5 seconds
    const interval = setInterval(triggerAnimation, 2500);
    return () => clearInterval(interval);
  }, []);

  const isShake = actionId === "shake_dice_action";
  const isBlow = actionId === "blow_dice_action";

  const diceBaseClasses =
    "relative w-10 h-10 rounded-lg border-2 bg-card border-border shadow-md";

  const diceValues = [3, 5, 6];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {diceValues.map((value, index) => (
          <div
            key={index}
            className={cn(
              diceBaseClasses,
              isAnimating && isShake && "animate-dice-shake-intense",
              isAnimating && isBlow && "animate-dice-blow"
            )}
            style={{
              animationDelay: isAnimating ? `${index * 50}ms` : undefined,
            }}
          >
            {isAnimating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {isShake ? (
                  <HelpCircle className="w-5 h-5 text-muted-foreground animate-pulse" />
                ) : (
                  <Wind className="w-5 h-5 text-muted-foreground animate-pulse" />
                )}
              </div>
            ) : (
              <PreviewDiceDots value={value} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {isShake ? "Shake animation preview" : "Blow animation preview"}
      </p>
    </div>
  );
};
