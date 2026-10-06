import { AnimatePresence, motion } from "framer-motion";

interface KiuluProps {
  /** 0..1 how full of coins the bucket looks */
  fill: number;
  /** Change this value to drop a coin in with a splash */
  dropKey?: number;
  size?: number;
  tipped?: boolean;
}

const STEAM = [0, 1, 2];

/** The Pot of the Day: a wooden sauna bucket (kiulu) filling up with coins. */
export const Kiulu = ({ fill, dropKey = 0, size = 96, tipped = false }: KiuluProps) => {
  const coinRows = Math.max(0, Math.min(5, Math.round(fill * 5)));

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={tipped ? { rotate: -70, x: -size * 0.15, y: size * 0.1 } : { rotate: 0, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      aria-hidden="true"
    >
      {/* Steam */}
      {!tipped &&
        STEAM.map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/40 blur-[3px]"
            style={{ width: size * 0.18, height: size * 0.18, left: size * (0.3 + i * 0.16), top: size * 0.12 }}
            animate={{ y: [0, -size * 0.45], opacity: [0, 0.7, 0], scale: [0.6, 1.4] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
          />
        ))}

      <svg viewBox="0 0 100 100" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="kiulu-wood" x1="0" x2="1">
            <stop offset="0" stopColor="#7a4a26" />
            <stop offset="0.5" stopColor="#b9773f" />
            <stop offset="1" stopColor="#6b3f1f" />
          </linearGradient>
          <radialGradient id="kiulu-coin" cx="0.35" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#fff3b0" />
            <stop offset="0.6" stopColor="#f2c230" />
            <stop offset="1" stopColor="#b88a12" />
          </radialGradient>
        </defs>
        {/* Handle */}
        <path d="M22 42 Q50 4 78 42" fill="none" stroke="#5b3a1e" strokeWidth="5" strokeLinecap="round" />
        {/* Coins peeking over the rim */}
        {Array.from({ length: coinRows }).map((_, row) =>
          [0, 1, 2, 3].map((c) => (
            <ellipse
              key={`${row}-${c}`}
              cx={30 + c * 13 + (row % 2) * 6}
              cy={47 - row * 3.2}
              rx="7"
              ry="3.4"
              fill="url(#kiulu-coin)"
              stroke="#9b7410"
              strokeWidth="0.6"
            />
          )),
        )}
        {/* Bucket body (staves) */}
        <path d="M18 46 L82 46 L74 92 L26 92 Z" fill="url(#kiulu-wood)" stroke="#4a2c14" strokeWidth="1.5" />
        {[30, 42, 54, 66].map((x) => (
          <line key={x} x1={x} y1="46" x2={x + (50 - x) * 0.16} y2="92" stroke="#5b3518" strokeWidth="0.8" opacity="0.6" />
        ))}
        {/* Metal bands */}
        <path d="M20 56 L80 56" stroke="#c9c2b6" strokeWidth="3.5" />
        <path d="M24 82 L76 82" stroke="#c9c2b6" strokeWidth="3.5" />
        <ellipse cx="50" cy="46" rx="32" ry="5" fill="none" stroke="#4a2c14" strokeWidth="1.5" />
      </svg>

      {/* Coin drop + splash */}
      <AnimatePresence>
        {dropKey > 0 && (
          <motion.div key={dropKey} className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-700 shadow"
              initial={{ y: -size * 0.9, opacity: 1, rotateY: 0 }}
              animate={{ y: size * 0.35, opacity: [1, 1, 0], rotateY: 720 }}
              transition={{ duration: 0.55, ease: "easeIn" }}
            />
            {[-1, -0.5, 0.5, 1].map((dx) => (
              <motion.div
                key={dx}
                className="absolute h-2 w-2 rounded-full bg-sky-200/80"
                style={{ left: "50%", top: "42%" }}
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: dx * size * 0.3, y: [-size * 0.2, size * 0.05] }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
