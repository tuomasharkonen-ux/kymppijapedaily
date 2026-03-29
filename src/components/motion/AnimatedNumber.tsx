 import { useEffect, useRef } from "react";
 import { motion, useMotionValue, useTransform, animate } from "framer-motion";
 
 interface AnimatedNumberProps {
   value: number;
   duration?: number;
   className?: string;
   formatFn?: (value: number) => string;
 }
 
 export const AnimatedNumber = ({ 
   value, 
   duration = 0.5, 
   className,
   formatFn = (v) => Math.round(v).toString(),
 }: AnimatedNumberProps) => {
   const motionValue = useMotionValue(0);
   const rounded = useTransform(motionValue, (v) => formatFn(v));
   const prevValue = useRef(0);
 
   useEffect(() => {
     const controls = animate(motionValue, value, { 
       duration,
       ease: "easeOut",
     });
     prevValue.current = value;
     
     return () => controls.stop();
   }, [value, duration, motionValue]);
 
   return <motion.span className={className}>{rounded}</motion.span>;
 };