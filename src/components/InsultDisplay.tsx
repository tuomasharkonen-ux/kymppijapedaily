import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InsultDisplayProps {
  insult: string | null;
  onComplete?: () => void;
}

export const InsultDisplay = ({ insult, onComplete }: InsultDisplayProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (insult) {
      setIsVisible(true);
      setIsExiting(false);
      setDisplayedText("");

      // Typewriter effect
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex < insult.length) {
          setDisplayedText(insult.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          
          // Wait 2 seconds then fade out
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              setDisplayedText("");
              onComplete?.();
            }, 300);
          }, 2000);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [insult, onComplete]);

  if (!isVisible || !insult) return null;

  return (
    <div
      className={cn(
        "relative bg-destructive text-destructive-foreground rounded-lg p-3 md:p-4 mb-4 shadow-lg",
        "border-2 border-destructive-foreground/20",
        "transition-all duration-300",
        isExiting ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-pop-in"
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* Speech bubble tail */}
      <div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-destructive"
        aria-hidden="true"
      />
      
      <p className="text-sm md:text-base font-medium text-center">
        <span aria-hidden="true" className="mr-1">🤬</span>
        {displayedText}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
};
