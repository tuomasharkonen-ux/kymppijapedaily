import React, { useState, useEffect, useMemo } from "react";
import { Dice, DiceSkin } from "./Dice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from "date-fns";
import { getSeededDice } from "@/lib/utils";

interface GameBoardProps {
  onGameComplete: (throws: number, winningNumber: number, initialDice: number[]) => void;
  hasPlayedToday: boolean;
  personalBest: number | null;
  userId: string;
  onShareClick?: () => void;
  activeSkin?: DiceSkin;
}

interface DiceState {
  value: number;
  isLocked: boolean;
}

export const GameBoard = ({ onGameComplete, hasPlayedToday, personalBest, userId, onShareClick, activeSkin = "default" }: GameBoardProps) => {
  // Generate deterministic initial dice based on userId and today's date
  const initialDiceValues = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return getSeededDice(userId, today);
  }, [userId]);

  const [dice, setDice] = useState<DiceState[]>(() => 
    Array(10).fill(null).map(() => ({ value: 0, isLocked: false }))
  );
  const [throwCount, setThrowCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [justCompletedGame, setJustCompletedGame] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [showCopied, setShowCopied] = useState(false);

  const copyResultToClipboard = async () => {
    if (!winningNumber) return;

    const today = format(new Date(), "dd.MM.yyyy");
    const diceEmojis = "🎲".repeat(throwCount);
    const bestScore = personalBest && personalBest < throwCount ? personalBest : throwCount;
    
    const shareText = `Kymppijape daily ${today}
Throws today: ${throwCount}
${diceEmojis}
Personal best: ${bestScore}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      
      // Trigger share feature achievement check
      if (onShareClick) {
        await onShareClick();
      }
    } catch {
      toast.error("Failed to copy");
    }
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
    const isFirstRoll = !hasStarted;
    
    if (!hasStarted) {
      setHasStarted(true);
    }
    
    setTimeout(() => {
      setDice(prev => prev.map((d, i) => {
        if (d.isLocked) return d;
        // Use seeded values for first roll, random for subsequent rolls
        const value = isFirstRoll ? initialDiceValues[i] : Math.floor(Math.random() * 6) + 1;
        return { ...d, value };
      }));
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
        setJustCompletedGame(true);
        triggerConfetti();
        onGameComplete(throwCount, winner, initialDiceValues);
      }
      
      return newDice;
    });
  };

  if (hasPlayedToday && !justCompletedGame) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4" aria-hidden="true">🫶</div>
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
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isRolling ? 'Rolling dice...' : hasStarted ? `Throws: ${throwCount}. Locked: ${dice.filter(d => d.isLocked).length} of 10.` : ''}
      </div>
      
      {gameComplete && winningNumber && (
        <div className="text-center animate-pop-in">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            Kymppijape! <span aria-hidden="true">🎉</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-4">
            All 10 dice showing {winningNumber}!
          </p>
          <Button 
            onClick={copyResultToClipboard}
            size="lg"
            className="animate-pop-in min-w-[220px]"
            variant={showCopied ? "secondary" : "default"}
          >
            {showCopied ? "✓ Copied to clipboard!" : <><span aria-hidden="true">📋</span> Share Result with Friends</>}
          </Button>
        </div>
      )}

      <Card className={!hasStarted ? "animate-border-glow" : ""}>
        <CardContent className="p-4 md:p-6">
          {hasStarted ? (
            <>
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
                    skin={activeSkin}
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
                aria-label={isRolling ? "Rolling dice" : "Roll dice"}
              >
                {isRolling ? (
                  <span className="animate-shake"><span aria-hidden="true">🎲</span> Rolling...</span>
                ) : (
                  <><span aria-hidden="true">🎲</span> Roll Dice</>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-6">Ready for today's challenge?</p>
              <Button onClick={rollDice} disabled={isRolling} size="lg" className="min-w-[200px]" aria-label={isRolling ? "Rolling dice" : "Roll dice"}>
                {isRolling ? <span className="animate-shake"><span aria-hidden="true">🎲</span> Rolling...</span> : <><span aria-hidden="true">🎲</span> Roll Dice</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
