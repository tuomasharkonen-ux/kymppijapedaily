import { useState, useEffect } from "react";
import { HelpCircle, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionPreviewProps {
  actionId: "shake_dice_action" | "blow_dice_action";
}

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
    "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2 bg-gradient-to-br from-background to-muted border-border shadow-md";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {[1, 2, 3].map((index) => (
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
              isShake ? (
                <HelpCircle className="w-5 h-5 text-muted-foreground animate-pulse" />
              ) : (
                <Wind className="w-5 h-5 text-muted-foreground animate-pulse" />
              )
            ) : (
              <span className="text-foreground">{index + 2}</span>
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
