import React, { useState, useEffect } from "react";
import { Dice } from "./Dice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";

interface GameBoardProps {
  onGameComplete: (throws: number, winningNumber: number) => void;
  hasPlayedToday: boolean;
  personalBest: number | null;
}

interface DiceState {
  value: number;
  isLocked: boolean;
}

const getInitialDice = (): DiceState[] => {
  return Array(10).fill(null).map(() => ({
    value: Math.floor(Math.random() * 6) + 1,
    isLocked: false,
  }));
};

export const GameBoard = ({ onGameComplete, hasPlayedToday, personalBest }: GameBoardProps) => {
  const [dice, setDice] = useState<DiceState[]>(getInitialDice());
  const [throwCount, setThrowCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  const copyResultToClipboard = () => {
    if (!winningNumber) return;

    const today = format(new Date(), "dd.MM.yyyy");
    const diceEmojis = "🎲".repeat(throwCount);
    const bestScore = personalBest && personalBest < throwCount ? personalBest : throwCount;
    
    const shareText = `Kymppijape daily ${today}
Throws today: ${throwCount} ${diceEmojis}
Personal best: ${bestScore}`;

    navigator.clipboard.writeText(shareText).then(() => {
      toast.success("Copied to clipboard!", {
        description: "Share your result with friends!",
      });
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  useEffect(() => {
    if (hasPlayedToday) {
      setGameComplete(true);
    }
  }, [hasPlayedToday]);

  const checkWin = (currentDice: DiceState[]) => {
    const allLocked = currentDice.every(d => d.isLocked);
    if (allLocked) {
      const firstValue = currentDice[0].value;
      const allSame = currentDice.every(d => d.value === firstValue);
      if (allSame) {
        return firstValue;
      }
    }
    return null;
  };

  const triggerConfetti = async () => {
    const confettiModule = await import("canvas-confetti");
    const confetti = confettiModule.default;
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ['#00a86b', '#50c878', '#228b22', '#32cd32', '#7fff00'],
      });
    }, 250);
  };

  const rollDice = () => {
    setIsRolling(true);
    
    setTimeout(() => {
      setDice(prev => prev.map(d => 
        d.isLocked ? d : { ...d, value: Math.floor(Math.random() * 6) + 1 }
      ));
      setIsRolling(false);
      setThrowCount(c => c + 1);
    }, 600);
  };

  const toggleLock = (index: number) => {
    if (isRolling || gameComplete) return;
    
    setDice(prev => {
      const newDice = [...prev];
      newDice[index] = { ...newDice[index], isLocked: !newDice[index].isLocked };
      
      const winner = checkWin(newDice);
      if (winner !== null) {
        setWinningNumber(winner);
        setGameComplete(true);
        triggerConfetti();
        onGameComplete(throwCount, winner);
      }
      
      return newDice;
    });
  };

  if (hasPlayedToday && !winningNumber) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4">🎲</div>
          <h2 className="text-xl font-semibold mb-2">Come back tomorrow!</h2>
          <p className="text-muted-foreground">
            You've already played today's Kymppijape. Check your results below!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {gameComplete && winningNumber && (
        <div className="text-center animate-pop-in">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            Kymppijape! 🎉
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            All 10 dice showing {winningNumber}!
          </p>
          <Button 
            onClick={copyResultToClipboard}
            size="lg"
            className="animate-pop-in"
          >
            📋 Share Result with Friends
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Throws: <span className="font-bold text-foreground text-lg">{throwCount}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Locked: <span className="font-bold text-foreground">{dice.filter(d => d.isLocked).length}/10</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 md:gap-4 justify-items-center mb-6">
            {dice.map((d, i) => (
              <Dice
                key={i}
                value={d.value}
                isLocked={d.isLocked}
                isRolling={isRolling && !d.isLocked}
                onClick={() => toggleLock(i)}
                disabled={gameComplete}
              />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mb-4">
            {gameComplete 
              ? "Game complete! See your results below."
              : "Click dice to lock them, then roll again"}
          </p>

          <Button
            onClick={rollDice}
            disabled={isRolling || gameComplete || dice.every(d => d.isLocked)}
            className="w-full"
            size="lg"
          >
            {isRolling ? (
              <span className="animate-shake">🎲 Rolling...</span>
            ) : (
              <>🎲 Roll Dice</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
