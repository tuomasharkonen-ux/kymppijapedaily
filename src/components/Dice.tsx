import { cn } from "@/lib/utils";

interface DiceProps {
  value: number;
  isLocked: boolean;
  isRolling: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const DiceDots = ({ value }: { value: number }) => {
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

  const positions = dotPositions[value] || [];

  return (
    <>
      {positions.map((pos, index) => (
        <div
          key={index}
          className={cn(
            "absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-foreground",
            positionClasses[pos]
          )}
        />
      ))}
    </>
  );
};

export const Dice = ({ value, isLocked, isRolling, onClick, disabled }: DiceProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isRolling}
      className={cn(
        "relative w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-md transition-all duration-300",
        "bg-card border-2",
        isLocked 
          ? "border-primary ring-2 ring-primary/50 animate-pulse-glow" 
          : "border-border hover:border-primary/50",
        isRolling && "animate-dice-roll",
        !isRolling && !disabled && "hover:scale-105 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <DiceDots value={value} />
      {isLocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-[10px] md:text-xs">🔒</span>
        </div>
      )}
    </button>
  );
};
