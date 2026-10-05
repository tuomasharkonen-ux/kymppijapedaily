import { useEffect } from "react";
import { motion } from "framer-motion";
import { buzz, playSound } from "@/lib/sound";

/** "PELATTU!" rubber stamp slam shown when bets are locked in. */
export const PelattuStamp = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const hit = setTimeout(() => {
      playSound("stamp");
      buzz([40, 30, 60]);
    }, 220);
    const done = setTimeout(onDone, 1500);
    return () => {
      clearTimeout(hit);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, 0, -8, 7, -4, 3, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, times: [0, 0.35, 0.45, 0.55, 0.65, 0.75, 1] }}
      role="status"
      aria-label="Bets locked in"
    >
      <motion.div
        initial={{ scale: 3.2, rotate: -24, opacity: 0 }}
        animate={{ scale: 1, rotate: -12, opacity: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 22, delay: 0.05 }}
        className="rounded-xl border-[6px] border-red-600 px-5 py-2 font-display text-5xl tracking-wider text-red-600 [text-shadow:0_0_1px_#dc2626] mix-blend-multiply"
        style={{
          background: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08), transparent 60%)",
          maskImage: "radial-gradient(circle at 50% 50%, black 70%, rgba(0,0,0,0.75) 100%)",
        }}
      >
        PELATTU!
      </motion.div>
    </motion.div>
  );
};
