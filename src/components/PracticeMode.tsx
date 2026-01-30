import React, { useState } from "react";
import { Dice, DiceSkin, DiceAnimationType } from "./Dice";
import { ActionButtons } from "./ActionButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthForm } from "./AuthForm";
import { CalendarDays, TrendingUp, Flame, Award, Trophy } from "lucide-react";

interface DiceState {
  value: number;
  isLocked: boolean;
}

const getEmptyDice = (): DiceState[] => {
  return Array(10).fill(null).map(() => ({
    value: 0,
    isLocked: false
  }));
};

interface PracticeModeProps {
  isLoggedIn?: boolean;
  activeSkin?: DiceSkin;
  purchasedItems?: string[];
  activeActions?: string[];
}

export const PracticeMode = ({
  isLoggedIn = false,
  activeSkin = "default",
  purchasedItems = [],
  activeActions = []
}: PracticeModeProps) => {
  const [dice, setDice] = useState<DiceState[]>(getEmptyDice());
  const [throwCount, setThrowCount] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isScrambled, setIsScrambled] = useState(false);
  const [currentAction, setCurrentAction] = useState<DiceAnimationType>(null);
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
          y: Math.random() - 0.2
        },
        colors: ["#00a86b", "#50c878", "#228b22", "#32cd32", "#7fff00"]
      });
    }, 250);
  };
  const rollDice = () => {
    setIsRolling(true);
    setIsScrambled(false);
    if (!hasStarted) {
      setHasStarted(true);
    }
    setTimeout(() => {
      setDice(prev => prev.map(d => d.isLocked ? d : {
        ...d,
        value: Math.floor(Math.random() * 6) + 1
      }));
      setIsRolling(false);
      setThrowCount(c => c + 1);
    }, 600);
  };

  const triggerAction = (actionType: DiceAnimationType) => {
    if (isRolling || gameComplete) return;
    
    // If dice aren't started yet, show them first
    if (!hasStarted) {
      setHasStarted(true);
    }
    
    // Set scrambled state immediately (icons appear with animation)
    setIsScrambled(true);
    setCurrentAction(actionType);
    
    // After animation completes, clear the action but keep scrambled
    setTimeout(() => {
      setCurrentAction(null);
    }, 800);
  };
  const toggleLock = (index: number) => {
    if (isRolling || gameComplete) return;
    setDice(prev => {
      const newDice = [...prev];
      newDice[index] = {
        ...newDice[index],
        isLocked: !newDice[index].isLocked
      };
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
    setDice(getEmptyDice());
    setThrowCount(0);
    setGameComplete(false);
    setWinningNumber(null);
    setHasStarted(false);
    setIsScrambled(false);
    setCurrentAction(null);
  };

  const getPercentile = (throws: number): number => {
    if (throws <= 6) return 1;
    if (throws <= 8) return 5;
    if (throws <= 10) return 15;
    if (throws <= 12) return 30;
    if (throws <= 14) return 50;
    if (throws <= 16) return 65;
    if (throws <= 18) return 75;
    if (throws <= 22) return 85;
    if (throws <= 28) return 95;
    return 99;
  };

  const getPercentileText = (throws: number): { text: string; highlight: boolean } => {
    const percentile = getPercentile(throws);
    if (percentile === 1) return { text: "Incredible! Top 1% result! 🏆", highlight: true };
    if (percentile === 5) return { text: "Amazing! Top 5% result! ⭐", highlight: true };
    return { text: `Top ${percentile}% result`, highlight: false };
  };

  if (gameComplete && winningNumber) {
    const percentileInfo = getPercentileText(throwCount);
    return <div className="space-y-6">
        <div className="text-center animate-pop-in">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-2">Kymppijape! <span aria-hidden="true">🎉</span></h2>
          <div className="py-4">
            <p className="text-lg text-muted-foreground mb-2">
              All 10 dice showing {winningNumber} in {throwCount} throws!
            </p>
            <p className={`text-sm ${percentileInfo.highlight ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {percentileInfo.text}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">(Practice mode - result not saved)</p>
          <Button onClick={resetGame} variant="outline" size="lg" aria-label="Play again">
            <span aria-hidden="true">🎲</span> Play Again
          </Button>
        </div>

        {!isLoggedIn && <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Want to track your progress?</CardTitle>
              <CardDescription>Sign up to save your scores and compete daily!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-6">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span>New game every day at midnight</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Track your best, worst, and average</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    <span>Build and maintain daily streaks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Unlock badges and earn credits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span>Compete and see your global rank</span>
                  </li>
                </ul>
              </div>
              <AuthForm onSuccess={() => {}} defaultToSignUp />
            </CardContent>
          </Card>}
      </div>;
  }
  return <div className="space-y-6">
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isRolling ? 'Rolling dice...' : hasStarted ? `Throws: ${throwCount}. Locked: ${dice.filter(d => d.isLocked).length} of 10.` : ''}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        <strong>What is Kymppijape?:</strong> Lock all 10 dice on the same number to win! Click a die to lock/unlock it, then roll again. Find out many rolls you need to get Kymppijape today! It's obviously pure skill, no luck involved.
      </p>

      <Card className={!hasStarted ? "animate-border-glow" : ""}>
        <CardContent className="p-4 md:p-6">
          {hasStarted ? <>
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
                    isScrambled={isScrambled && !d.isLocked}
                    animationType={!d.isLocked ? currentAction : null}
                  />
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground mb-4">Click dice to lock them, then roll again</p>

              <Button onClick={rollDice} disabled={isRolling || gameComplete || dice.every(d => d.isLocked)} className="w-full" size="lg" aria-label={isRolling ? "Rolling dice" : "Roll dice"}>
                {isRolling ? <span className="animate-shake"><span aria-hidden="true">🎲</span> Rolling...</span> : <><span aria-hidden="true">🎲</span> Roll Dice</>}
              </Button>

              {isLoggedIn && (
                <ActionButtons
                  purchasedItems={purchasedItems}
                  activeActions={activeActions}
                  onActionClick={triggerAction}
                  disabled={isRolling || gameComplete}
                />
              )}
            </> : <div className="py-8">
              <p className="text-muted-foreground mb-6 text-center">Ready to test your dice rolling skills?</p>
              <Button onClick={rollDice} disabled={isRolling || currentAction !== null} size="lg" className="w-full" aria-label={isRolling ? "Rolling dice" : "Roll dice"}>
                {isRolling ? <span className="animate-shake"><span aria-hidden="true">🎲</span> Rolling...</span> : <><span aria-hidden="true">🎲</span> Roll Dice</>}
              </Button>
              {isLoggedIn && (
                <ActionButtons
                  purchasedItems={purchasedItems}
                  activeActions={activeActions}
                  onActionClick={triggerAction}
                  disabled={isRolling}
                  isAnimating={currentAction !== null}
                />
              )}
            </div>}
        </CardContent>
      </Card>

      {!isLoggedIn && <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg">Save your progress</CardTitle>
            <CardDescription>Sign up or sign in to unlock all features!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>New game every day at midnight</span>
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Track your best, worst, and average</span>
                </li>
                <li className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  <span>Build and maintain daily streaks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span>Unlock badges and earn credits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Compete and see your global rank</span>
                </li>
              </ul>
            </div>
            <AuthForm onSuccess={() => {}} />
          </CardContent>
        </Card>}
    </div>;
};