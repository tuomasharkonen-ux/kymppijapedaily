 import { cn } from "@/lib/utils";
 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
import { Lock, HelpCircle, Wind, Angry } from "lucide-react";
 import { springs, diceShake, diceBlow, diceCower, hoverScale, tapScale, pulseGlow } from "@/lib/animations";

 export type DiceSkin = "default" | "golden_dice" | "diamond_dice" | "german_supermarket_dice";
 export type DiceAnimationType = 'shake' | 'blow' | 'insult' | null;
 
 interface DiceProps {
   value: number;
   isLocked: boolean;
   isRolling: boolean;
   onClick: () => void;
   disabled?: boolean;
   skin?: DiceSkin;
   isScrambled?: boolean;
   animationType?: DiceAnimationType;
 }
 
 // Skin-specific styles
 const skinStyles: Record<DiceSkin, { bg: string; border: string; dot: string; glow?: string }> = {
   default: {
     bg: "bg-card",
     border: "border-border",
     dot: "bg-foreground",
   },
   golden_dice: {
     bg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
     border: "border-amber-600",
     dot: "bg-amber-900",
     glow: "shadow-[0_0_15px_rgba(251,191,36,0.5)]",
   },
   diamond_dice: {
     bg: "bg-gradient-to-br from-cyan-200 via-blue-300 to-purple-300",
     border: "border-blue-400",
     dot: "bg-blue-900",
     glow: "shadow-[0_0_15px_rgba(147,197,253,0.6)]",
   },
   german_supermarket_dice: {
     bg: "bg-yellow-400",
     border: "border-red-600 border-[3px]",
     dot: "bg-blue-600",
   },
 };
 
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
   "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
   "top-left": "top-2 left-2",
   "top-right": "top-2 right-2",
   "middle-left": "top-1/2 left-2 -translate-y-1/2",
   "middle-right": "top-1/2 right-2 -translate-y-1/2",
   "bottom-left": "bottom-2 left-2",
   "bottom-right": "bottom-2 right-2",
 };
 
 const DiceDotsWithSkin = ({ value, skin = "default" }: { value: number; skin?: DiceSkin }) => {
   const positions = value > 0 ? (dotPositions[value] || []) : [];
   const dotColor = skinStyles[skin].dot;
 
   return (
     <AnimatePresence mode="wait">
       <motion.div
         key={value}
         initial={{ opacity: 0, scale: 0.8 }}
         animate={{ opacity: 1, scale: 1 }}
         exit={{ opacity: 0, scale: 0.8 }}
         transition={{ duration: 0.15 }}
         className="absolute inset-0"
       >
         {positions.map((pos, index) => (
           <motion.div
             key={`${value}-${pos}`}
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ 
               ...springs.bouncy,
               delay: index * 0.02,
             }}
             className={cn(
               "absolute w-2.5 h-2.5 md:w-3 md:h-3 rounded-full",
               dotColor,
               positionClasses[pos]
             )}
           />
         ))}
       </motion.div>
     </AnimatePresence>
   );
 };
 
 // Scrambled state placeholder with animation
 const ScrambledPlaceholder = ({ type, skin = "default" }: { type: DiceAnimationType; skin?: DiceSkin }) => {
   const iconColor = skinStyles[skin].dot;
   
   const getIcon = () => {
     switch (type) {
       case 'blow':
         return Wind;
       case 'insult':
         return Angry;
       default:
         return HelpCircle;
     }
   };
   
   const IconComponent = getIcon();
   
   return (
     <motion.div 
       className="absolute inset-0 flex items-center justify-center"
       initial={{ opacity: 0, rotate: -10 }}
       animate={{ 
         opacity: [0.5, 1, 0.5], 
         rotate: [0, 5, -5, 0],
         scale: [0.9, 1, 0.9],
       }}
       transition={{ 
         duration: 1.5, 
         repeat: Infinity,
         ease: "easeInOut",
       }}
     >
       <IconComponent 
         className={cn(
           "w-6 h-6 md:w-8 md:h-8",
           iconColor.replace('bg-', 'text-')
         )} 
       />
     </motion.div>
   );
 };
 
 export const Dice = ({ 
   value, 
   isLocked, 
   isRolling, 
   onClick, 
   disabled, 
   skin = "default",
   isScrambled = false,
   animationType = null
 }: DiceProps) => {
   const [displayValue, setDisplayValue] = useState(value);
   const [lastScrambleType, setLastScrambleType] = useState<DiceAnimationType>(null);
   const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'rolling' | 'shake' | 'blow' | 'cower'>('idle');
 
   // Track the last action type for showing appropriate placeholder
   useEffect(() => {
     if (animationType) {
       setLastScrambleType(animationType);
     }
   }, [animationType]);
 
   // Handle animations based on animationType
   useEffect(() => {
     if (isRolling) {
       setCurrentAnimation('rolling');
     } else if (animationType === 'shake' && !isLocked) {
       setCurrentAnimation('shake');
       const timeout = setTimeout(() => setCurrentAnimation('idle'), 800);
       return () => clearTimeout(timeout);
     } else if (animationType === 'blow' && !isLocked) {
       setCurrentAnimation('blow');
       const timeout = setTimeout(() => setCurrentAnimation('idle'), 600);
       return () => clearTimeout(timeout);
     } else if (animationType === 'insult' && !isLocked) {
       setCurrentAnimation('cower');
       const timeout = setTimeout(() => setCurrentAnimation('idle'), 800);
       return () => clearTimeout(timeout);
     } else {
       setCurrentAnimation('idle');
     }
   }, [animationType, isLocked, isRolling]);
 
   // Tumble effect while rolling
   useEffect(() => {
     if (isRolling) {
       const tumbleInterval = setInterval(() => {
         setDisplayValue(Math.floor(Math.random() * 6) + 1);
       }, 50);
 
       const timeout = setTimeout(() => {
         clearInterval(tumbleInterval);
         setDisplayValue(value);
       }, 550);
 
       return () => {
         clearInterval(tumbleInterval);
         clearTimeout(timeout);
       };
     } else {
       setDisplayValue(value);
     }
   }, [isRolling, value]);
 
   const styles = skinStyles[skin];
   const showScrambled = isScrambled && !isLocked && !isRolling;
 
   // Get animation props based on current state
   const getAnimateValue = () => {
     switch (currentAnimation) {
       case 'rolling':
         return {
           rotate: [0, 90, 180, 270, 360],
           scale: [1, 0.9, 1.05, 0.95, 1],
           transition: { duration: 0.55, ease: "easeInOut" as const },
         };
       case 'shake':
         return diceShake;
       case 'blow':
         return diceBlow;
       case 'cower':
         return diceCower;
       default:
         return { rotate: 0, scale: 1, x: 0, y: 0 };
     }
   };
 
   return (
     <motion.button
       onClick={onClick}
       disabled={disabled || isRolling}
       aria-label={`Die ${value > 0 ? `showing ${value}` : 'not rolled'}, ${isLocked ? 'locked' : 'unlocked'}${isScrambled ? ', scrambled' : ''}. Click to ${isLocked ? 'unlock' : 'lock'}.`}
       aria-pressed={isLocked}
       className={cn(
         "relative w-12 h-12 md:w-16 md:h-16 rounded-lg shadow-md",
         styles.bg,
         "border-2",
         isLocked 
           ? "border-primary ring-2 ring-primary/50" 
           : styles.border + " hover:border-primary/50",
         styles.glow,
         disabled && "opacity-50 cursor-not-allowed",
         !disabled && "cursor-pointer"
       )}
       animate={getAnimateValue()}
       whileHover={!disabled && !isRolling ? hoverScale : undefined}
       whileTap={!disabled && !isRolling ? tapScale : undefined}
     >
       <AnimatePresence mode="wait">
         {showScrambled ? (
           <ScrambledPlaceholder key="scrambled" type={lastScrambleType} skin={skin} />
         ) : (
           <DiceDotsWithSkin key="dots" value={displayValue} skin={skin} />
         )}
       </AnimatePresence>
       
       {/* Lock indicator with animation */}
       <AnimatePresence>
         {isLocked && (
           <motion.div 
             className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center"
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             exit={{ scale: 0 }}
             transition={springs.bouncy}
           >
             <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary-foreground" />
           </motion.div>
         )}
       </AnimatePresence>
     </motion.button>
   );
 };
