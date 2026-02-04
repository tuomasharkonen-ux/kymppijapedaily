import { useState, useEffect } from "react";
import { HelpCircle, Wind, Angry } from "lucide-react";
import { cn } from "@/lib/utils";
import { diceInsults } from "@/lib/diceInsults";

interface ActionPreviewProps {
  actionId: "shake_dice_action" | "blow_dice_action" | "insult_dice_action";
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

// Sample insults for preview
const sampleInsults = [
  diceInsults[0],
  diceInsults[14],
  diceInsults[29],
];

export const ActionPreview = ({ actionId }: ActionPreviewProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentInsultIndex, setCurrentInsultIndex] = useState(0);
  const [showInsult, setShowInsult] = useState(false);

  // Auto-trigger animation loop
  useEffect(() => {
    const triggerAnimation = () => {
      setIsAnimating(true);
      if (actionId === "insult_dice_action") {
        setShowInsult(true);
      }
      setTimeout(() => setIsAnimating(false), 800);
    };

    // Initial trigger
    triggerAnimation();

    // Loop - longer interval for insults to let them be readable
    const loopInterval = actionId === "insult_dice_action" ? 4000 : 2500;
    const interval = setInterval(() => {
      if (actionId === "insult_dice_action") {
        setShowInsult(false);
        // Small delay before showing next insult
        setTimeout(() => {
          setCurrentInsultIndex(prev => (prev + 1) % sampleInsults.length);
          triggerAnimation();
        }, 300);
      } else {
        triggerAnimation();
      }
    }, loopInterval);
    return () => clearInterval(interval);
  }, [actionId]);

  const isShake = actionId === "shake_dice_action";
  const isBlow = actionId === "blow_dice_action";
  const isInsult = actionId === "insult_dice_action";

  const diceBaseClasses =
    "relative w-10 h-10 rounded-lg border-2 bg-card border-border shadow-md";

  const diceValues = [3, 5, 6];

  const getIcon = () => {
    if (isShake) return <HelpCircle className="w-5 h-5 text-muted-foreground animate-pulse" />;
    if (isBlow) return <Wind className="w-5 h-5 text-muted-foreground animate-pulse" />;
    if (isInsult) return <Angry className="w-5 h-5 text-destructive animate-pulse" />;
    return null;
  };

  const getAnimationClass = () => {
    if (isShake) return "animate-dice-shake-intense";
    if (isBlow) return "animate-dice-blow";
    if (isInsult) return "animate-dice-cower";
    return "";
  };

  const getLabel = () => {
    if (isShake) return "Shake animation preview";
    if (isBlow) return "Blow animation preview";
    if (isInsult) return "Insult animation preview";
    return "";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Fixed height container for insult speech bubble to prevent layout shift */}
      {isInsult && (
        <div className="h-14 flex items-end justify-center">
          {showInsult && (
            <div className="relative bg-destructive text-destructive-foreground rounded-lg px-3 py-2 text-xs max-w-[200px] text-center animate-pop-in">
              <div 
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-destructive"
                aria-hidden="true"
              />
              🤬 {sampleInsults[currentInsultIndex].slice(0, 40)}...
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        {diceValues.map((value, index) => (
          <div
            key={index}
            className={cn(
              diceBaseClasses,
              isAnimating && getAnimationClass()
            )}
            style={{
              animationDelay: isAnimating ? `${index * 50}ms` : undefined,
            }}
          >
            {isAnimating ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {getIcon()}
              </div>
            ) : (
              <PreviewDiceDots value={value} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {getLabel()}
      </p>
    </div>
  );
};
