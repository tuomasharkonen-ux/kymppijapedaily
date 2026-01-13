import React, { useState } from "react";
import { Dice } from "./Dice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "./AuthForm";

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

export const PracticeMode = () => {
  const [dice, setDice] = useState<DiceState[]>(getInitialDice());
  const [throwCount, setThrowCount] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);

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
      }
      
      return newDice;
    });
  };

  const resetGame = () => {
    setDice(getInitialDice());
    setThrowCount(1);
    setGameComplete(false);
    setWinningNumber(null);
  };

  if (gameComplete && winningNumber) {
    return (
      <div className="space-y-6">
        <div className="text-center animate-pop-in">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            Kymppijape! 🎉
          </h2>
          <p className="text-lg text-muted-foreground mb-2">
            All 10 dice showing {winningNumber} in {throwCount} throws!
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            (Practice mode - result not saved)
          </p>
          <Button onClick={resetGame} variant="outline" size="lg">
            🎲 Play Again
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Want to track your progress?</CardTitle>
            <CardDescription>
              Sign up to save your scores, compete daily, and track your personal best!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onSuccess={() => {}} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Practice Mode:</strong> Lock all 10 dice on the same number to win! 
            Click a die to lock/unlock it, then roll again. Sign up to save your scores!
          </p>
        </CardContent>
      </Card>

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
            Click dice to lock them, then roll again
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

      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-lg">Save your progress</CardTitle>
          <CardDescription>
            Sign up or sign in to track your scores and compete daily!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm onSuccess={() => {}} />
        </CardContent>
      </Card>
    </div>
  );
};
