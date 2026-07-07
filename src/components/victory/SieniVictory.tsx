import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sieniFaceIcons } from "@/components/Dice";

interface Props {
  winningNumber: number;
  onComplete: () => void;
}

const Layer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`fixed inset-0 z-[100] pointer-events-none overflow-hidden ${className}`}>{children}</div>
);

// Hero mushroom image, centred and glowing
const HeroSieni = ({
  src,
  size = 200,
  glow = "rgba(255,255,255,0.5)",
  animate,
  transition,
}: {
  src: string;
  size?: number;
  glow?: string;
  animate?: any;
  transition?: any;
}) => (
  <motion.img
    src={src}
    alt=""
    draggable={false}
    className="absolute left-1/2 top-1/2 select-none"
    style={{
      width: size,
      height: size,
      marginLeft: -size / 2,
      marginTop: -size / 2,
      objectFit: "contain",
      filter: `drop-shadow(0 8px 24px ${glow})`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={animate ?? { scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
    transition={transition ?? { duration: 0.9, ease: "easeOut" }}
  />
);

// 1. KANTARELLI — Golden harvest + SUIII 🐐 -------------------------------
const KantarelliVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [onComplete]);

  const sparkles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    size: 16 + Math.random() * 28,
    emoji: "✨",
  }));

  // A couple of "SUIII" texts flying across the screen (inside joke)
  const suiiis = [
    { id: 0, from: { x: "-40vw", y: "60vh" }, to: { x: "60vw", y: "-20vh" }, rotate: -18, delay: 0.3, size: "clamp(2.5rem, 9vw, 6rem)" },
    { id: 1, from: { x: "120vw", y: "20vh" }, to: { x: "-30vw", y: "70vh" }, rotate: 14, delay: 0.9, size: "clamp(2rem, 7vw, 5rem)" },
    { id: 2, from: { x: "30vw", y: "120vh" }, to: { x: "45vw", y: "-30vh" }, rotate: -8, delay: 1.5, size: "clamp(1.8rem, 6vw, 4rem)" },
  ];

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,200,60,0.55), rgba(200,140,0,0.2) 55%, transparent 80%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, times: [0, 0.15, 0.75, 1] }}
      />
      <HeroSieni
        src={sieniFaceIcons[1]}
        size={200}
        glow="rgba(255,190,40,0.9)"
        animate={{ scale: [0, 1.3, 1.1], opacity: [0, 1, 1], rotate: [0, -4, 4, 0] }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ left: `${s.left}%`, top: "-8%", fontSize: s.size, filter: "drop-shadow(0 0 8px rgba(255,200,60,0.9))" }}
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: window.innerHeight * 1.1, opacity: [0, 1, 1, 0], scale: [0.5, 1, 0.8] }}
          transition={{ duration: 2.4, delay: s.delay, ease: "easeIn" }}
        >
          {s.emoji}
        </motion.div>
      ))}
      {suiiis.map((s) => (
        <motion.span
          key={s.id}
          className="absolute left-1/2 top-1/2 font-black italic tracking-tight"
          style={{
            fontSize: s.size,
            marginLeft: "-15vw",
            color: "#fff",
            WebkitTextStroke: "3px #b45309",
            textShadow: "0 4px 16px rgba(180,83,9,0.9), 0 0 30px rgba(255,200,60,0.8)",
            whiteSpace: "nowrap",
          }}
          initial={{ x: s.from.x, y: s.from.y, opacity: 0, rotate: s.rotate, scale: 0.7 }}
          animate={{
            x: [s.from.x, s.to.x],
            y: [s.from.y, s.to.y],
            opacity: [0, 1, 1, 0],
            rotate: [s.rotate, s.rotate + 6, s.rotate],
            scale: [0.7, 1.15, 1],
          }}
          transition={{ duration: 1.6, delay: s.delay, ease: "easeInOut" }}
        >
          SUIII
        </motion.span>
      ))}
    </Layer>
  );
};

// 2. SUPPILOVAHVERO — cozy autumn rain + leaves --------------------------
const SuppilovahveroVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3200);
    return () => clearTimeout(t);
  }, [onComplete]);

  const leaves = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    size: 20 + Math.random() * 26,
    drift: (Math.random() - 0.5) * 120,
    rotate: Math.random() * 720 - 360,
    emoji: ["🍂", "🍁"][Math.floor(Math.random() * 2)],
  }));

  const rain = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    len: 30 + Math.random() * 40,
  }));

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(90,110,80,0.35), rgba(40,55,40,0.55) 70%, rgba(20,30,20,0.7))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, times: [0, 0.15, 0.8, 1] }}
      />
      <HeroSieni src={sieniFaceIcons[2]} size={190} glow="rgba(150,120,70,0.8)" />
      {rain.map((r) => (
        <motion.div
          key={`r-${r.id}`}
          className="absolute"
          style={{ left: `${r.left}%`, top: "-10%", width: 2, height: r.len, background: "linear-gradient(to bottom, transparent, rgba(180,200,210,0.6))" }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: window.innerHeight * 1.15, opacity: [0, 0.8, 0] }}
          transition={{ duration: 1, delay: r.delay, repeat: 1, ease: "easeIn" }}
        />
      ))}
      {leaves.map((l) => (
        <motion.div
          key={l.id}
          className="absolute"
          style={{ left: `${l.left}%`, top: "-8%", fontSize: l.size }}
          initial={{ y: 0, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: window.innerHeight * 1.1, x: l.drift, opacity: [0, 1, 1, 0], rotate: l.rotate }}
          transition={{ duration: 3, delay: l.delay, ease: "easeInOut" }}
        >
          {l.emoji}
        </motion.div>
      ))}
    </Layer>
  );
};

// 3. HERKKUTATTI — regal king fanfare ------------------------------------
const HerkkutattiVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [onComplete]);

  const rays = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(180,130,50,0.5), rgba(90,60,20,0.25) 55%, transparent 80%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, times: [0, 0.15, 0.75, 1] }}
      />
      {/* Rotating light rays */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: 0, height: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        {rays.map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 origin-top"
            style={{
              width: 40,
              height: "60vh",
              marginLeft: -20,
              transform: `rotate(${deg}deg)`,
              background: "linear-gradient(to bottom, rgba(255,215,120,0.35), transparent 70%)",
            }}
          />
        ))}
      </motion.div>
      <HeroSieni
        src={sieniFaceIcons[3]}
        size={210}
        glow="rgba(210,160,70,0.9)"
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: [40, 0, 0] }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {/* Crown descending onto the cap */}
      <motion.div
        className="absolute left-1/2"
        style={{ top: "22%", marginLeft: -40, fontSize: 80, filter: "drop-shadow(0 4px 10px rgba(180,120,0,0.8))" }}
        initial={{ y: -window.innerHeight * 0.4, opacity: 0, scale: 0.5 }}
        animate={{ y: 0, opacity: [0, 1, 1], scale: [0.5, 1.2, 1] }}
        transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
      >
        👑
      </motion.div>
      {/* Bronze shimmer sweep */}
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(115deg, transparent 40%, rgba(255,220,140,0.5) 50%, transparent 60%)" }}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: ["-100%", "100%"], opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, delay: 1.4, ease: "easeInOut" }}
      />
    </Layer>
  );
};

// 4. KORVASIENI — toxic danger warning -----------------------------------
const KorvasieniVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3200);
    return () => clearTimeout(t);
  }, [onComplete]);

  const fumes = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: 30 + Math.random() * 40,
    delay: Math.random() * 1.5,
    size: 30 + Math.random() * 50,
    drift: (Math.random() - 0.5) * 120,
    emoji: Math.random() > 0.5 ? "☠️" : "💨",
  }));

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(80,200,60,0.4), rgba(20,60,20,0.5) 60%, rgba(10,20,10,0.7))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, times: [0, 0.15, 0.8, 1] }}
      />
      {/* Warning flashes */}
      {[0.3, 0.7, 1.1].map((d, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at center, rgba(200,40,40,0.5), transparent 45%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, delay: d }}
        />
      ))}
      <HeroSieni src={sieniFaceIcons[4]} size={190} glow="rgba(120,220,80,0.9)" />
      {fumes.map((f) => (
        <motion.div
          key={f.id}
          className="absolute"
          style={{ left: `${f.left}%`, bottom: "20%", fontSize: f.size, filter: "drop-shadow(0 0 10px rgba(80,220,60,0.8))" }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -window.innerHeight * 0.7, x: f.drift, opacity: [0, 1, 1, 0], scale: [0.6, 1.3, 1.1] }}
          transition={{ duration: 2.4, delay: f.delay, ease: "easeOut" }}
        >
          {f.emoji}
        </motion.div>
      ))}
      {/* Hazard-stripe shear */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(45deg, rgba(220,180,0,0.35) 0px, rgba(220,180,0,0.35) 30px, rgba(30,30,30,0.35) 30px, rgba(30,30,30,0.35) 60px)",
          mixBlendMode: "overlay",
        }}
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: [0, 0.9, 0], x: [0, -30, 20, 0] }}
        transition={{ duration: 1, delay: 1.6 }}
      />
    </Layer>
  );
};

// 5. MUSTATORVISIENI — ominous dark smoke --------------------------------
const MustatorvisieniVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3300);
    return () => clearTimeout(t);
  }, [onComplete]);

  const smoke = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    delay: Math.random() * 1.8,
    size: 40 + Math.random() * 70,
    drift: (Math.random() - 0.5) * 100,
  }));

  const spores = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    size: 8 + Math.random() * 10,
  }));

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(60,60,70,0.3), rgba(10,10,15,0.75) 55%, rgba(0,0,0,0.92))" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.3, times: [0, 0.15, 0.8, 1] }}
      />
      <HeroSieni
        src={sieniFaceIcons[5]}
        size={190}
        glow="rgba(120,120,140,0.7)"
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: [30, 0, 0] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      {smoke.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            bottom: "15%",
            width: s.size,
            height: s.size,
            background: "radial-gradient(circle, rgba(40,40,50,0.7), transparent 70%)",
            filter: "blur(6px)",
          }}
          initial={{ y: 0, x: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: -window.innerHeight * 0.8, x: s.drift, opacity: [0, 0.9, 0], scale: [0.5, 1.8, 2.4], rotate: s.drift }}
          transition={{ duration: 2.8, delay: s.delay, ease: "easeOut" }}
        />
      ))}
      {spores.map((s) => (
        <motion.div
          key={`sp-${s.id}`}
          className="absolute rounded-full"
          style={{ left: `${s.left}%`, top: "-5%", width: s.size, height: s.size, background: "rgba(200,200,210,0.7)", filter: "blur(1px)" }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: window.innerHeight * 1.1, opacity: [0, 0.8, 0] }}
          transition={{ duration: 3, delay: s.delay, ease: "easeIn" }}
        />
      ))}
      {/* Closing vignette */}
      <motion.div
        className="absolute inset-0"
        style={{ boxShadow: "inset 0 0 200px 120px rgba(0,0,0,0.9)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 3.3, times: [0, 0.5, 0.8, 1] }}
      />
    </Layer>
  );
};

// 6. KÄRPÄSSIENI — psychedelic trip (showpiece) --------------------------
const KarpassieniVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3500);
    return () => clearTimeout(t);
  }, [onComplete]);

  const spots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2,
    size: 14 + Math.random() * 30,
  }));

  const rings = [0, 0.4, 0.8, 1.2, 1.6];

  return (
    <Layer>
      {/* Rotating rainbow swirl */}
      <motion.div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: "220vmax",
          height: "220vmax",
          marginLeft: "-110vmax",
          marginTop: "-110vmax",
          background: "conic-gradient(from 0deg, #ff0055, #ffaa00, #ffee00, #00dd77, #00aaff, #aa00ff, #ff0055)",
          filter: "blur(20px)",
        }}
        initial={{ rotate: 0, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 360, opacity: [0, 0.7, 0.7, 0], scale: [0.6, 1, 1] }}
        transition={{ rotate: { duration: 4, ease: "linear" }, opacity: { duration: 3.5, times: [0, 0.15, 0.8, 1] }, scale: { duration: 2 } }}
      />
      {/* Concentric ripple rings */}
      {rings.map((delay, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border-4"
          style={{ width: 100, height: 100, marginLeft: -50, marginTop: -50, borderColor: "rgba(255,255,255,0.7)" }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: [0, 10], opacity: [0.8, 0] }}
          transition={{ duration: 2, delay, ease: "easeOut" }}
        />
      ))}
      <HeroSieni
        src={sieniFaceIcons[6]}
        size={220}
        glow="rgba(255,80,120,0.9)"
        animate={{ scale: [0, 1.4, 1.15, 1.3, 1.2], opacity: [0, 1, 1], rotate: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />
      {/* Drifting white spots */}
      {spots.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.9))" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0.8], y: [0, -40, -20] }}
          transition={{ duration: 2, delay: s.delay, repeat: Infinity, repeatDelay: 0.5 }}
        />
      ))}
    </Layer>
  );
};

export const SieniVictory = ({ winningNumber, onComplete }: Props) => {
  const calledRef = useRef(false);
  const handleComplete = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    onComplete();
  };

  return (
    <AnimatePresence>
      {winningNumber === 1 && <KantarelliVictory key="1" onComplete={handleComplete} />}
      {winningNumber === 2 && <SuppilovahveroVictory key="2" onComplete={handleComplete} />}
      {winningNumber === 3 && <HerkkutattiVictory key="3" onComplete={handleComplete} />}
      {winningNumber === 4 && <KorvasieniVictory key="4" onComplete={handleComplete} />}
      {winningNumber === 5 && <MustatorvisieniVictory key="5" onComplete={handleComplete} />}
      {winningNumber === 6 && <KarpassieniVictory key="6" onComplete={handleComplete} />}
    </AnimatePresence>
  );
};
