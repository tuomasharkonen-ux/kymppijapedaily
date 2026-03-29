 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
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
          
          // Wait a bit then fade out
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              setDisplayedText("");
              onComplete?.();
            }, 300);
          }, 3000);
        }
      }, 30);

      return () => clearInterval(typeInterval);
    }
  }, [insult, onComplete]);

 
  return (
    <AnimatePresence>
      {isVisible && insult && !isExiting && (
        <motion.div
          className={cn(
            "absolute left-1/2 bottom-full mb-3 z-10",
            "bg-destructive text-destructive-foreground rounded-lg p-3 md:p-4 shadow-lg",
            "border-2 border-destructive-foreground/20",
            "w-[90%] max-w-sm"
          )}
          style={{ x: "-50%" }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
            <motion.span 
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              |
            </motion.span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
