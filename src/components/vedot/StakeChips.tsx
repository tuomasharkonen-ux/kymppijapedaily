import { motion } from "framer-motion";
import { playSound } from "@/lib/sound";

const CHIPS = [
  { value: 10, color: "#e5e7eb", ring: "#6b7280", text: "#1f2937" },
  { value: 25, color: "#dc2626", ring: "#fecaca", text: "#fff" },
  { value: 50, color: "#2563eb", ring: "#bfdbfe", text: "#fff" },
  { value: 100, color: "#111827", ring: "#facc15", text: "#facc15" },
];

interface StakeChipsProps {
  stake: number;
  max: number;
  onChange: (stake: number) => void;
}

export const Chip = ({ value, size = 44 }: { value: number; size?: number }) => {
  const chip = CHIPS.slice().reverse().find((c) => value >= c.value) ?? CHIPS[0];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold shadow-[0_2px_0_rgba(0,0,0,0.45)]"
      style={{
        width: size,
        height: size,
        background: `repeating-conic-gradient(${chip.color} 0deg 30deg, ${chip.ring} 30deg 45deg)`,
        fontSize: size * 0.3,
      }}
    >
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: size * 0.7, height: size * 0.7, background: chip.color, color: chip.text, border: `2px dashed ${chip.ring}` }}
      >
        {value}
      </span>
    </span>
  );
};

/** Casino chips: tap to add to the stake. */
export const StakeChips = ({ stake, max, onChange }: StakeChipsProps) => (
  <div className="flex items-center gap-2">
    {CHIPS.map((chip) => {
      const disabled = stake + chip.value > max;
      return (
        <motion.button
          key={chip.value}
          type="button"
          whileTap={{ scale: 0.85, y: -6 }}
          disabled={disabled}
          onClick={() => {
            playSound("tick");
            onChange(stake + chip.value);
          }}
          className="rounded-full disabled:opacity-30"
          aria-label={`Add ${chip.value} credits`}
        >
          <Chip value={chip.value} size={40} />
        </motion.button>
      );
    })}
    <div className="ml-auto flex items-center gap-2">
      {/* Stack that grows with the stake */}
      <div className="relative h-10 w-10" aria-hidden="true">
        {Array.from({ length: Math.min(8, Math.ceil(stake / 25)) }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-0"
            style={{ bottom: i * 3 }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            <Chip value={stake} size={40} />
          </motion.div>
        ))}
      </div>
      <div className="text-right">
        <div className="font-display text-2xl leading-none text-[#f7d774]">{stake}</div>
        {stake > 0 && (
          <button type="button" onClick={() => onChange(0)} className="text-[11px] text-white/50 underline">
            clear
          </button>
        )}
      </div>
    </div>
  </div>
);
