import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice, DiceSkin, DiceAnimationType } from "./Dice";
import { type ThrowAnimationStyle, type BackgroundStyle, getBackgroundStyles } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionButtons, ActionType } from "./ActionButtons";
import { InsultDisplay } from "./InsultDisplay";
import { useShakeDetection, MotionPermissionStatus } from "@/hooks/useShakeDetection";
import { toast } from "sonner";
import { format } from "date-fns";
import { getSeededDice } from "@/lib/utils";
import { getRandomInsult } from "@/lib/diceInsults";
import { Smartphone } from "lucide-react";
 import { AnimatedNumber } from "@/components/motion";
 import { staggerContainer, staggerItem, popIn, fadeInUp } from "@/lib/animations";

interface GameBoardProps {
  onGameComplete: (throws: number, winningNumber: number, initialDice: number[], usedAction: boolean) => void;
  hasPlayedToday: boolean;
  personalBest: number | null;
  userId: string;
  onShareClick?: () => void;
  activeSkin?: DiceSkin;
  purchasedItems?: string[];
  activeActions?: string[];
  activeThrowAnimation?: ThrowAnimationStyle;
  activeBackground?: BackgroundStyle;
  onCopyResult?: () => Promise<void>;
  isStatsLoading?: boolean;
  showCopied?: boolean;
}

interface DiceState {
  value: number;
  isLocked: boolean;
}

export const GameBoard = ({ onGameComplete, hasPlayedToday, personalBest, userId, onShareClick, activeSkin = "default", purchasedItems = [], activeActions = [], activeThrowAnimation = "default", activeBackground = "default", onCopyResult, isStatsLoading, showCopied }: GameBoardProps) => {
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
  const [usedActionDuringGame, setUsedActionDuringGame] = useState(false);

  // Action states
  const [isScrambled, setIsScrambled] = useState(false);
  const [currentAction, setCurrentAction] = useState<DiceAnimationType>(null);
  const [currentInsult, setCurrentInsult] = useState<string | null>(null);

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
    setIsScrambled(false); // Clear scrambled state when rolling
    setCurrentAction(null);
    setCurrentInsult(null); // Clear any insult when rolling
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

  // Handle action button clicks (Shake/Blow/Insult)
  const triggerAction = useCallback((actionType: ActionType) => {
    if (isRolling || gameComplete) return;
    
    // If dice aren't started yet, show them first
    if (!hasStarted) {
      setHasStarted(true);
    }
    
    // Track that an action was used during this game
    setUsedActionDuringGame(true);
    
    // Set scrambled state immediately (icons appear with animation)
    setIsScrambled(true);
    setCurrentAction(actionType);
    
    // For insult action, pick a random insult
    if (actionType === 'insult') {
      setCurrentInsult(getRandomInsult());
    }
    
    // After animation completes, clear the action but keep scrambled
    setTimeout(() => {
      setCurrentAction(null);
    }, 800);
  }, [isRolling, gameComplete, hasStarted]);

  // Clear insult when it completes
  const handleInsultComplete = useCallback(() => {
    setCurrentInsult(null);
  }, []);

  // Check if shake action is available (owned and active)
  const isShakeActionActive = purchasedItems.includes('shake_dice_action') && 
    activeActions.includes('shake_dice_action');

  // Handle phone shake detection
  const handlePhoneShake = useCallback(() => {
    if (isShakeActionActive && !isRolling && !gameComplete && currentAction === null) {
      triggerAction('shake');
    }
  }, [isShakeActionActive, isRolling, gameComplete, currentAction, triggerAction]);

  // Use shake detection hook
  const { permissionStatus, requestPermission, isListening, isSupported } = useShakeDetection({
    onShake: handlePhoneShake,
    enabled: isShakeActionActive && !isRolling && !gameComplete && currentAction === null,
    threshold: 15,
    timeout: 1000,
  });

  // Handle permission request button click
  const handleEnableShake = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Shake detection enabled! 📱 Shake your phone to trigger the dice.");
    } else {
      toast.error("Motion permission denied. Check your browser settings to enable.");
    }
  };

  // Show permission prompt if shake is active but permission not granted
  const showShakePermissionPrompt = isShakeActionActive && 
    isSupported && 
    permissionStatus !== 'granted' && 
    permissionStatus !== 'not-supported';

  const toggleLock = (index: number) => {
    if (isRolling || gameComplete || isScrambled) return;
    
    setDice(prev => {
      const newDice = [...prev];
      newDice[index] = { ...newDice[index], isLocked: !newDice[index].isLocked };
      
      const winner = checkWin(newDice);
      if (winner !== null) {
        setWinningNumber(winner);
        setGameComplete(true);
        setJustCompletedGame(true);
        triggerConfetti();
        onGameComplete(throwCount, winner, initialDiceValues, usedActionDuringGame);
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
      
       <AnimatePresence>
         {gameComplete && winningNumber && (
           <motion.div 
             className="text-center"
             variants={popIn}
             initial="initial"
             animate="animate"
             exit="exit"
           >
             <motion.h2 
               className="text-4xl md:text-5xl font-bold text-primary mb-2"
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
             >
               Kymppijape! <span aria-hidden="true">🎉</span>
             </motion.h2>
             <motion.p 
               className="text-lg text-muted-foreground mb-4"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               All 10 dice showing {winningNumber}!
             </motion.p>
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.5 }}
             >
               <Button 
                 onClick={onCopyResult}
                 disabled={isStatsLoading}
                 size="lg"
                 className="min-w-[220px]"
                 variant={showCopied ? "secondary" : "default"}
               >
                 {isStatsLoading ? (
                   <><span aria-hidden="true">⏳</span> Loading stats...</>
                 ) : showCopied ? (
                   "✓ Copied to clipboard!"
                 ) : (
                   <><span aria-hidden="true">📋</span> Share Result with Friends</>
                 )}
               </Button>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

      <Card className={`${!hasStarted ? "animate-border-glow" : ""} ${getBackgroundStyles(activeBackground)} overflow-hidden`}>
        <CardContent className="p-4 md:p-6">
          {hasStarted ? (
            <>
               <motion.div 
                 className="flex justify-between items-center mb-4"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ duration: 0.3 }}
               >
                 <div className="flex flex-col items-center">
                     <AnimatedNumber value={throwCount} className="font-display font-bold text-foreground text-4xl md:text-5xl" />
                   <span className="text-xs text-muted-foreground uppercase tracking-wide">Throws</span>
                 </div>
                 <div className="flex flex-col items-center">
                     <span className="font-display font-bold text-foreground text-4xl md:text-5xl">
                     <AnimatedNumber value={dice.filter(d => d.isLocked).length} />/10
                   </span>
                   <span className="text-xs text-muted-foreground uppercase tracking-wide">Locked</span>
                 </div>
               </motion.div>

              {showShakePermissionPrompt && (
                <Alert className="mb-4">
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span className="text-sm">Enable shake detection to shake dice by shaking your phone!</span>
                    <Button size="sm" variant="secondary" onClick={handleEnableShake}>
                      Enable
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

               <motion.div 
                 className="relative grid grid-cols-5 gap-2 md:gap-4 justify-items-center mb-6"
                 variants={staggerContainer}
                 initial="initial"
                 animate="animate"
               >
                <InsultDisplay insult={currentInsult} onComplete={handleInsultComplete} />
                 {dice.map((d, i) => (
                   <motion.div key={i} variants={staggerItem}>
                     <Dice
                       value={d.value}
                       isLocked={d.isLocked}
                       isRolling={isRolling && !d.isLocked}
                       onClick={() => toggleLock(i)}
                       disabled={gameComplete}
                       skin={activeSkin}
                       isScrambled={isScrambled}
                       animationType={currentAction}
                       throwAnimation={activeThrowAnimation}
                     />
                   </motion.div>
                 ))}
               </motion.div>

              <p className="text-center text-sm text-muted-foreground mb-4">
                {gameComplete 
                  ? "Game complete! See your results below."
                  : "Click dice to lock them, then roll again"}
              </p>

              <Button
                onClick={rollDice}
                disabled={isRolling || gameComplete || dice.every(d => d.isLocked) || currentAction !== null}
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

              <ActionButtons
                purchasedItems={purchasedItems}
                activeActions={activeActions}
                onActionClick={triggerAction}
                disabled={isRolling || gameComplete || dice.every(d => d.isLocked)}
                isAnimating={currentAction !== null}
              />
            </>
          ) : (
            <div className="py-8">
              <p className="text-muted-foreground mb-6 text-center">Ready for today's challenge?</p>
              <Button onClick={rollDice} disabled={isRolling || currentAction !== null} size="lg" className="w-full" aria-label={isRolling ? "Rolling dice" : "Roll dice"}>
                {isRolling ? <span className="animate-shake"><span aria-hidden="true">🎲</span> Rolling...</span> : <><span aria-hidden="true">🎲</span> Roll Dice</>}
              </Button>
              <ActionButtons
                purchasedItems={purchasedItems}
                activeActions={activeActions}
                onActionClick={triggerAction}
                disabled={isRolling}
                isAnimating={currentAction !== null}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
