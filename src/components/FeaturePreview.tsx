import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MokkiPreview } from "@/components/mokki/MokkiPreview";

const DEMO_TIERS = [
  { emoji: "🙂", name: "Varma", odds: ["1.8", "1.7", "1.9"] },
  { emoji: "😬", name: "Rohkea", odds: ["4.3", "3.9", "4.8"] },
  { emoji: "🤯", name: "Hullu", odds: ["19", "16", "22"] },
];

const BettingPreview = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex gap-2" aria-hidden="true">
      {DEMO_TIERS.map((tier, i) => {
        const odds = tier.odds[tick % tier.odds.length];
        const selected = tick % 3 === i;
        return (
          <motion.div
            key={tier.name}
            animate={{ y: selected ? -6 : 0, scale: selected ? 1.06 : 1 }}
            className={`w-20 rounded-lg border-2 p-2 text-center bg-background ${selected ? "border-primary shadow-lg" : "border-border"}`}
          >
            <div className="text-xl">{tier.emoji}</div>
            <div className="text-xs font-semibold">{tier.name}</div>
            <motion.div
              key={odds}
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-1 font-mono font-bold text-primary"
            >
              ×{odds}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export const FeaturePreview = ({ featureId }: { featureId: string }) => {
  if (featureId === "betting_license") return <BettingPreview />;
  if (featureId === "mokki_plot") return <MokkiPreview />;
  return null;
};
