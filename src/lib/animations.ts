 import { Variants, Transition } from "framer-motion";
 
 // Spring physics configurations
 export const springs = {
   gentle: { type: "spring", stiffness: 200, damping: 25 } as Transition,
   bouncy: { type: "spring", stiffness: 500, damping: 30 } as Transition,
   stiff: { type: "spring", stiffness: 700, damping: 35 } as Transition,
   dice: { type: "spring", stiffness: 300, damping: 20 } as Transition,
 };
 
 // Fade animations
 export const fadeIn: Variants = {
   initial: { opacity: 0 },
   animate: { opacity: 1, transition: { duration: 0.3 } },
   exit: { opacity: 0, transition: { duration: 0.2 } },
 };
 
 export const fadeInUp: Variants = {
   initial: { opacity: 0, y: 10 },
   animate: { opacity: 1, y: 0, transition: springs.gentle },
   exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
 };
 
 // Pop/Scale animations
 export const popIn: Variants = {
   initial: { scale: 0, opacity: 0 },
   animate: { 
     scale: 1, 
     opacity: 1,
     transition: springs.bouncy,
   },
   exit: { scale: 0.8, opacity: 0, transition: { duration: 0.15 } },
 };
 
 export const scaleIn: Variants = {
   initial: { scale: 0.9, opacity: 0 },
   animate: { scale: 1, opacity: 1, transition: springs.gentle },
   exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
 };
 
 // Stagger animations
 export const staggerContainer: Variants = {
   initial: {},
   animate: {
     transition: {
       staggerChildren: 0.05,
       delayChildren: 0.1,
     },
   },
 };
 
 export const staggerItem: Variants = {
   initial: { opacity: 0, y: 10 },
   animate: { 
     opacity: 1, 
     y: 0,
     transition: springs.gentle,
   },
 };
 
 // Dice-specific animations
 export const diceRoll: Variants = {
   rolling: {
     rotate: [0, 90, 180, 270, 360],
     scale: [1, 0.9, 1.05, 0.95, 1],
     transition: {
       duration: 0.55,
       ease: "easeInOut",
     },
   },
   idle: {
     rotate: 0,
     scale: 1,
   },
 };
 
 export const diceShake = {
   x: [-3, 3, -5, 5, -7, 7, -5, 5, -3, 3, -2, 0],
   rotate: [-2, 2, -3, 3, -4, 4, -3, 3, -2, 2, -1, 0],
   transition: { duration: 0.8 },
 };
 
 export const diceBlow = {
   x: [0, 8, 12, 10, 6, 3, 0],
   rotate: [0, 5, 8, 6, 3, 1, 0],
   scale: [1, 0.95, 0.92, 0.95, 0.98, 1, 1],
   transition: { duration: 0.6, ease: "easeOut" },
 };
 
 export const diceCower = {
   scale: [1, 0.85, 0.9, 0.82, 0.88, 0.85, 0.9, 1],
   y: [0, 3, 1, 4, 2, 3, 1, 0],
   transition: { duration: 0.8 },
 };
 
 // Hover and tap interactions
 export const hoverScale = {
   scale: 1.05,
   transition: springs.gentle,
 };
 
 export const tapScale = {
   scale: 0.95,
 };
 
 // Pulse glow animation for locked dice
 export const pulseGlow = {
   boxShadow: [
     "0 0 0 0 hsl(var(--primary) / 0.4)",
     "0 0 0 8px hsl(var(--primary) / 0.2)",
     "0 0 0 0 hsl(var(--primary) / 0)",
   ],
   transition: {
     duration: 2.5,
     repeat: Infinity,
     ease: "easeInOut",
   },
 };
 
 // Badge/Modal entrance sequences
 export const modalBackdrop: Variants = {
   initial: { opacity: 0 },
   animate: { opacity: 1, transition: { duration: 0.2 } },
   exit: { opacity: 0, transition: { duration: 0.15 } },
 };
 
 export const modalContent: Variants = {
   initial: { scale: 0.9, opacity: 0, y: 20 },
   animate: { 
     scale: 1, 
     opacity: 1, 
     y: 0,
     transition: springs.bouncy,
   },
   exit: { scale: 0.95, opacity: 0, y: 10, transition: { duration: 0.15 } },
 };
 
// Legendary badge floating effect
export const floatingAnimation = {
  y: [-2, 2, -2],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

// Throw animation styles
export type ThrowAnimationStyle = 'default' | 'turbo_spin_throw' | 'bounce_drop_throw';

export const getThrowAnimation = (style: ThrowAnimationStyle) => {
  switch (style) {
    case 'turbo_spin_throw':
      return {
        rotate: [0, 180, 360, 540, 720],
        scale: [1, 0.85, 1.1, 0.9, 1],
        filter: ["blur(0px)", "blur(2px)", "blur(3px)", "blur(1px)", "blur(0px)"],
        transition: { duration: 0.6, ease: "easeInOut" as const },
      };
    case 'bounce_drop_throw':
      return {
        y: [-60, 0, -20, 0, -8, 0],
        scale: [0.8, 1.1, 0.95, 1.05, 0.98, 1],
        rotate: [0, 15, -10, 5, -2, 0],
        transition: { duration: 0.7, ease: "easeOut" as const },
      };
    default:
      return {
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 0.9, 1.05, 0.95, 1],
        transition: { duration: 0.55, ease: "easeInOut" as const },
      };
  }
};