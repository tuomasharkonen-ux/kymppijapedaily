import { cn } from "@/lib/utils";
import { helldiversFaceIcons, sieniFaceIcons, type DiceSkin } from "@/components/Dice";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SaunaThermometer } from "@/components/SaunaThermometer";

interface DicePreviewProps {
  skin: DiceSkin;
}

// Skin-specific styles (same as Dice.tsx)
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
  sauna_dice: {
    bg: "bg-gradient-to-br from-amber-100 via-amber-200 to-yellow-300",
    border: "border-amber-700 border-[2px]",
    dot: "bg-amber-900",
    glow: "shadow-[0_0_12px_rgba(180,120,60,0.4)]",
  },
  helldivers_dice: {
    bg: "bg-black",
    border: "border-red-700 border-[2px]",
    dot: "bg-white",
    glow: "shadow-[0_0_12px_rgba(220,40,40,0.45)]",
  },
  sieni_dice: {
    bg: "bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200",
    border: "border-amber-800 border-[2px]",
    dot: "bg-amber-900",
    glow: "shadow-[0_0_12px_rgba(120,72,20,0.35)]",
  },
};

interface Leaf {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

const PreviewDie = ({ value, skin, isRolling }: { value: number; skin: DiceSkin; isRolling: boolean }) => {
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
    "top-left": "top-1 left-1",
    "top-right": "top-1 right-1",
    "middle-left": "top-1/2 left-1 -translate-y-1/2",
    "middle-right": "top-1/2 right-1 -translate-y-1/2",
    "bottom-left": "bottom-1 left-1",
    "bottom-right": "bottom-1 right-1",
  };

  const positions = dotPositions[value] || [];
  const styles = skinStyles[skin];

  return (
    <div className="relative w-10 h-10">
      {skin === "sauna_dice" && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{ height: "200%", top: "auto", zIndex: 10 }}
        >
          <div className="sauna-steam-1" />
          <div className="sauna-steam-2" />
          <div className="sauna-steam-3" />
          <div className="sauna-steam-4" />
          <div className="sauna-steam-5" />
          <div className="sauna-steam-6" />
        </div>
      )}
      <motion.div
        className={cn(
          "relative w-10 h-10 rounded-lg border-2",
          styles.bg,
          styles.border,
          styles.glow
        )}
        animate={
          isRolling
            ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.1, 0.95, 1.05, 1] }
            : { rotate: 0, scale: 1 }
        }
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        {skin === "helldivers_dice" ? (
          <img
            src={helldiversFaceIcons[value]}
            alt=""
            draggable={false}
            className="absolute inset-0.5 w-[calc(100%-0.25rem)] h-[calc(100%-0.25rem)] object-contain pointer-events-none select-none"
          />
        ) : skin === "sieni_dice" ? (
          <img
            src={sieniFaceIcons[value]}
            alt=""
            draggable={false}
            className="absolute inset-0.5 w-[calc(100%-0.25rem)] h-[calc(100%-0.25rem)] object-contain pointer-events-none select-none"
          />
        ) : (
          positions.map((pos, index) => (
            <div
              key={index}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                styles.dot,
                positionClasses[pos]
              )}
            />
          ))
        )}
      </motion.div>
    </div>
  );
};

/** Thin ambient steam wisps for the preview background */
const PreviewSteamOverlay = ({ heatLevel }: { heatLevel: number }) => {
  if (heatLevel === 0) return null;
  const positions = heatLevel >= 2 ? [5, 22, 40, 58, 76, 93] : [12, 45, 78];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl" style={{ zIndex: 2 }}>
      {positions.map((left, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${left}%`,
            width: "22%",
            height: "60%",
            borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
            background: "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.13), rgba(255,255,255,0))",
            filter: "blur(12px)",
            animation: `sauna-steam-rise ${2.3 + (i % 3) * 0.5}s ease-out infinite`,
            animationDelay: `${(i * 0.4) % 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export const DicePreview = ({ skin }: DicePreviewProps) => {
  const [diceValues, setDiceValues] = useState([1, 3, 6]);
  const [isRolling, setIsRolling] = useState(false);
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  // Simulated throw count for the sauna preview — cycles through all heat levels
  const [simThrows, setSimThrows] = useState(0);

  useEffect(() => {
    if (skin !== "sauna_dice") return;

    const interval = setInterval(() => {
      setIsRolling(true);

      // Water droplets burst upward (löyly)
      const newLeaves: Leaf[] = Array.from({ length: 6 }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 1.2);
        const distance = 40 + Math.random() * 35;
        return {
          id: Date.now() + i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: Math.random() * 360,
        };
      });
      setLeaves(newLeaves);

      setTimeout(() => {
        setDiceValues([
          Math.ceil(Math.random() * 6),
          Math.ceil(Math.random() * 6),
          Math.ceil(Math.random() * 6),
        ]);
        setIsRolling(false);
        // Advance the simulated throw count: +2 per cycle, reset at 23
        setSimThrows(t => (t + 2) % 23);
      }, 550);

      setTimeout(() => setLeaves([]), 700);
    }, 3000);

    return () => clearInterval(interval);
  }, [skin]);

  // Derive heat level from simulated throws (same thresholds as the real game)
  const heatLevel =
    skin !== "sauna_dice" ? 0
    : simThrows >= 20 ? 3
    : simThrows >= 15 ? 2
    : simThrows >= 10 ? 1
    : 0;

  const numColor =
    heatLevel >= 3 ? "text-red-400"
    : heatLevel === 2 ? "text-red-300"
    : heatLevel === 1 ? "text-yellow-300"
    : "text-white/80";

  if (skin === "sauna_dice") {
    return (
      <div
        className="relative rounded-xl overflow-hidden p-4"
        style={{
          background: `
            repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(180deg, rgba(0,0,0,0.015) 0px, rgba(255,255,255,0.04) 3px, transparent 3px, transparent 12px),
            linear-gradient(175deg, hsl(28 55% 52%) 0%, hsl(25 50% 44%) 40%, hsl(22 48% 38%) 100%)
          `,
          boxShadow: heatLevel >= 3 ? "0 0 20px 3px rgba(248,113,113,0.25)" : undefined,
          width: 260,
        }}
      >
        <PreviewSteamOverlay heatLevel={heatLevel} />

        {/* Dice row + thermometer */}
        <div className="relative flex items-center justify-between gap-3" style={{ zIndex: 5 }}>
          {/* Water droplets */}
          <AnimatePresence>
            {leaves.map((leaf) => (
              <motion.span
                key={leaf.id}
                className="absolute pointer-events-none select-none text-sm"
                style={{ zIndex: 20, left: "40%", top: "50%" }}
                initial={{ x: -8, y: -8, opacity: 1, scale: 0.8, rotate: 0 }}
                animate={{ x: leaf.x, y: leaf.y, opacity: 0, scale: 1.2, rotate: leaf.rotate }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              >
                💧
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Dice */}
          <div className="flex items-center gap-2">
            {diceValues.map((value, index) => (
              <PreviewDie key={index} value={value} skin={skin} isRolling={isRolling} />
            ))}
          </div>

          {/* Thermometer */}
          <div className="flex-shrink-0">
            <SaunaThermometer throwCount={simThrows} heatLevel={heatLevel} size={48} />
          </div>
        </div>

        {/* Heat level label — fixed height so the container never reflows */}
        <div className="relative mt-2 h-8 flex items-center justify-center text-center" style={{ zIndex: 5 }}>
          <span className={`text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${numColor}`}>
            {heatLevel >= 3 ? "🔥 MAX LÖYLY — THE SAUNA IS ALIVE"
              : heatLevel === 2 ? "It's getting dangerously hot in here…"
              : heatLevel === 1 ? "The sauna is warming up! 🌡"
              : "Toss water on the stones. Build the heat."}
          </span>
        </div>
      </div>
    );
  }

  // Default preview for all other skins
  return (
    <div className="relative flex items-center justify-center gap-3">
      <AnimatePresence>
        {leaves.map((leaf) => (
          <motion.span
            key={leaf.id}
            className="absolute pointer-events-none select-none text-sm"
            style={{ zIndex: 20, left: "50%", top: "50%" }}
            initial={{ x: -8, y: -8, opacity: 1, scale: 0.8, rotate: 0 }}
            animate={{ x: leaf.x, y: leaf.y, opacity: 0, scale: 1.2, rotate: leaf.rotate }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            💧
          </motion.span>
        ))}
      </AnimatePresence>

      {diceValues.map((value, index) => (
        <PreviewDie key={index} value={value} skin={skin} isRolling={isRolling} />
      ))}
    </div>
  );
};
