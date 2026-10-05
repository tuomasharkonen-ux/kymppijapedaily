import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { playSound } from "@/lib/sound";

interface SplitFlapProps {
  value: string;
  className?: string;
  tileClassName?: string;
}

/** Departure-board style text: each character flips when it changes. */
export const SplitFlap = ({ value, className = "", tileClassName = "" }: SplitFlapProps) => {
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current !== value) playSound("flip");
    previous.current = value;
  }, [value]);

  return (
    <span className={`inline-flex gap-[2px] [perspective:400px] ${className}`} aria-label={value}>
      {value.split("").map((char, i) => (
        <motion.span
          key={`${i}-${char}`}
          aria-hidden="true"
          initial={{ rotateX: -90, opacity: 0.2 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ delay: i * 0.05, duration: 0.28, ease: "easeOut" }}
          className={`relative inline-block min-w-[0.72em] rounded-[3px] bg-[#14100c] px-[2px] text-center font-mono leading-tight text-[#f7d774] shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.6)] [transform-origin:50%_50%] ${tileClassName}`}
        >
          {char}
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/70" />
        </motion.span>
      ))}
    </span>
  );
};
