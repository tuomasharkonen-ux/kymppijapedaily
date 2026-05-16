import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bastionSvg from "@/assets/helldivers/bastion.svg";
import autocannonSvg from "@/assets/helldivers/autocannon.svg";
import hellbombPng from "@/assets/helldivers/hellbomb.png";
import eagle500Svg from "@/assets/helldivers/eagle500.svg";

interface Props {
  winningNumber: number;
  onComplete: () => void;
}

const Layer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`fixed inset-0 z-[100] pointer-events-none overflow-hidden ${className}`}>{children}</div>
);

// 1. NAPALM ---------------------------------------------------------------
const NapalmVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3000);
    return () => clearTimeout(t);
  }, [onComplete]);

  const flames = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    size: 40 + Math.random() * 80,
    emoji: Math.random() > 0.3 ? "🔥" : "💥",
  }));

  return (
    <Layer>
      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at bottom, rgba(255,80,0,0.55), rgba(120,0,0,0.25) 50%, transparent 80%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, times: [0, 0.15, 0.75, 1] }}
      />
      {flames.map((f) => (
        <motion.div
          key={f.id}
          className="absolute"
          style={{ left: `${f.left}%`, bottom: "-10%", fontSize: f.size, filter: "drop-shadow(0 0 12px rgba(255,120,0,0.9))" }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{ y: -(window.innerHeight * (0.5 + Math.random() * 0.7)), opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1, 0.8] }}
          transition={{ duration: 2.2, delay: f.delay, ease: "easeOut" }}
        >
          {f.emoji}
        </motion.div>
      ))}
    </Layer>
  );
};

// 2. BASTION TANK ---------------------------------------------------------
// Blue barrel tip in 126×126 SVG viewBox: ~(114, 76). At 220×220 + bottom:10%:
//   left = calc(20vw + 199px), bottom = calc(10% + 87px)
const BASTION_BARREL_LEFT = "calc(20vw + 199px)";
const BASTION_BARREL_BOTTOM = "calc(10% + 87px)";

const BastionVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 4500);
    return () => clearTimeout(t);
  }, [onComplete]);

  // 3 heavy shots, 0.8 s apart; tank drives in by ~0.6 s
  const shots = [0.7, 1.5, 2.3];
  // Total anim = 4 s; recoil times as fractions
  const recoilTimes = [
    0, 0.175, 0.188, 0.225,
       0.375, 0.388, 0.425,
       0.575, 0.588, 0.625,
    0.9, 1.0,
  ];
  const recoilX = [0, 0, -22, 4, 0, -22, 4, 0, -22, 4, 0, 0];

  return (
    <Layer>
      <motion.div
        className="absolute"
        style={{ bottom: "10%", left: 0 }}
        initial={{ x: "-30vw" }}
        animate={{ x: ["-30vw", "20vw", "20vw", "120vw"] }}
        transition={{ duration: 4, times: [0, 0.15, 0.80, 1], ease: "easeInOut" }}
      >
        <motion.img
          src={bastionSvg}
          alt=""
          style={{ width: 220, height: 220, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.6))" }}
          animate={{ y: [0, -2, 0, -3, 0], x: recoilX }}
          transition={{
            y: { duration: 0.3, repeat: Infinity },
            x: { duration: 4, times: recoilTimes, ease: "easeOut" },
          }}
        />
      </motion.div>

      {/* Muzzle flash */}
      {shots.map((delay, i) => (
        <motion.div
          key={`mf-${i}`}
          className="absolute rounded-full"
          style={{
            left: BASTION_BARREL_LEFT,
            bottom: BASTION_BARREL_BOTTOM,
            width: 50, height: 50,
            marginLeft: -25, marginBottom: -25,
            background: "radial-gradient(circle, #fff 0%, #ffe066 40%, transparent 70%)",
            boxShadow: "0 0 30px 15px rgba(255,220,0,0.9)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.8, 0.5] }}
          transition={{ duration: 0.2, delay }}
        />
      ))}

      {/* Tank rounds */}
      {shots.map((delay, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: BASTION_BARREL_LEFT,
            bottom: BASTION_BARREL_BOTTOM,
            marginBottom: -7,
            width: 80, height: 14,
            borderRadius: "2px 40% 40% 2px",
            background: "linear-gradient(to right, #5a2d00, #c06000, #ffcc44, #fffbe0)",
            boxShadow: "0 0 50px 14px rgba(255,160,0,0.85), 0 0 100px 25px rgba(255,80,0,0.4)",
          }}
          initial={{ x: 0, opacity: 0, scaleX: 0.2 }}
          animate={{ x: ["0px", "calc(70vw - 200px)"], opacity: [0, 1, 1, 0], scaleX: [0.2, 1.3, 1.1, 0.8] }}
          transition={{ duration: 1.3, delay, ease: "easeOut" }}
        />
      ))}

      {/* Impact explosions */}
      {shots.map((delay, i) => (
        <motion.div
          key={`f-${i}`}
          className="absolute"
          style={{ bottom: "calc(10% + 100px)", right: "10vw", fontSize: 120 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2.8, 3.5] }}
          transition={{ duration: 0.7, delay: delay + 1.2 }}
        >
          💥
        </motion.div>
      ))}
    </Layer>
  );
};

// 3. AUTOCANNON SENTRY ----------------------------------------------------
// Barrel tip in the 126×126 SVG viewBox is at approximately (115, 25.5).
// Rendered at 200×200 and centered at left:50%, the tip lands at:
//   left = calc(50% - 100px + 182px) = calc(50% + 82px)
//   top  = calc(10% + 40px)
const BARREL_LEFT = "calc(50% + 82px)";
const BARREL_TOP = "calc(50% - 60px)";

const AutocannonVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 4500);
    return () => clearTimeout(t);
  }, [onComplete]);

  const tracers = [
    { id: 0, delay: 1.0 },
    { id: 1, delay: 2.0 },
    { id: 2, delay: 3.0 },
  ];

  return (
    <Layer>
      <motion.div
        className="absolute"
        style={{ left: "50%", top: "50%", marginLeft: -100, marginTop: -100 }}
        initial={{ y: "-100vh" }}
        animate={{ y: [-window.innerHeight, 0, 0] }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <motion.img
          src={autocannonSvg}
          alt=""
          style={{ width: 200, height: 200, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.6))" }}
          animate={{
            x:      [0,  0, -28,  4, 0,   0, -28,  4, 0,   0, -28,  4, 0,  0],
            rotate: [0,  0, -12,  2, 0,   0, -12,  2, 0,   0, -12,  2, 0,  0],
          }}
          transition={{
            duration: 4.5,
            times:   [0, 0.222, 0.233, 0.278, 0.44, 0.444, 0.456, 0.500, 0.66, 0.667, 0.678, 0.722, 0.98, 1.0],
            ease: "easeOut",
          }}
        />
      </motion.div>
      {tracers.map((t) => (
        <motion.div
          key={t.id}
          className="absolute rounded-full"
          style={{
            top: BARREL_TOP,
            left: BARREL_LEFT,
            width: 50,
            height: 14,
            background: "linear-gradient(to right, transparent, #ffe066, #ff5722)",
            boxShadow: "0 0 20px 6px rgba(255,180,0,0.8)",
            translateY: "-50%",
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: window.innerWidth * 0.7, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, delay: t.delay, ease: "easeOut" }}
        />
      ))}
      {tracers.map((t) => (
        <motion.div
          key={`m-${t.id}`}
          className="absolute"
          style={{ top: BARREL_TOP, left: BARREL_LEFT, fontSize: 90, translate: "-50% -50%" }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2.2, 1.2] }}
          transition={{ duration: 0.4, delay: t.delay }}
        >
          💥
        </motion.div>
      ))}
    </Layer>
  );
};

// 4. HELLBOMB -------------------------------------------------------------
const HellbombVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 5000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <Layer>
      {/* Falling bomb */}
      <motion.img
        src={hellbombPng}
        alt=""
        className="absolute"
        style={{ width: 200, height: 200, left: "50%", marginLeft: -100, top: "30%", filter: "drop-shadow(0 6px 24px rgba(0,0,0,0.8))" }}
        initial={{ y: -window.innerHeight, opacity: 1 }}
        animate={{
          y: [-window.innerHeight, 0, 0, 0, 0],
          scale: [1, 1, 1.1, 1, 1.15],
          rotate: [0, 0, -2, 2, 0],
          opacity: [1, 1, 1, 1, 0],
        }}
        transition={{ duration: 1.8, times: [0, 0.4, 0.55, 0.75, 0.9] }}
      />
      {/* Speech bubble */}
      <div className="absolute" style={{ left: "50%", top: "calc(30% - 70px)", transform: "translateX(-50%)" }}>
        <motion.div
          style={{
            background: "white",
            color: "#1a1a1a",
            fontWeight: 700,
            fontSize: 15,
            whiteSpace: "nowrap",
            padding: "8px 14px",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            pointerEvents: "none",
            position: "relative",
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.9], y: [10, 0, 0, -6] }}
          transition={{ duration: 1.1, delay: 0.8, times: [0, 0.15, 0.75, 1] }}
        >
          ☢️ Hellbomb armed — clear the area!
          <div style={{
            position: "absolute",
            bottom: -10,
            left: "50%",
            marginLeft: -10,
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid white",
          }} />
        </motion.div>
      </div>
      {/* Tick flashes */}
      {[0.7, 1.1, 1.5].map((d, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at center, rgba(255,0,0,0.6), transparent 40%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.25, delay: d }}
        />
      ))}
      {/* Massive white flash */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.8, 0] }}
        transition={{ duration: 1.3, delay: 1.85, times: [0, 0.05, 0.4, 0.7, 1] }}
      />
      {/* Scramble blocks */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(0deg, rgba(255,0,0,0.4) 0px, rgba(255,0,0,0.4) 4px, transparent 4px, transparent 12px), repeating-linear-gradient(90deg, rgba(0,200,255,0.3) 0px, rgba(0,200,255,0.3) 3px, transparent 3px, transparent 10px)",
          mixBlendMode: "screen",
        }}
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: [0, 1, 1, 0], x: [0, -20, 20, -10, 10, 0] }}
        transition={{ duration: 1, delay: 2.0 }}
      />
      {/* Mushroom cloud — fireball core */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200, height: 200,
          left: "50%", marginLeft: -100,
          top: "50%", marginTop: -100,
          background: "radial-gradient(circle, #fff 0%, #ffd54a 25%, #ff6a00 55%, #8b1100 100%)",
          boxShadow: "0 0 120px 60px rgba(255,140,0,0.85)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 6, 10, 12], opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: 2.2, delay: 2.0, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
      />
      {/* Mushroom stem */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "20%", width: 100, height: 0,
          background: "linear-gradient(to top, #6b3a1a, #c2693b, #f0a86a)",
          borderRadius: 20, filter: "blur(3px)",
        }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: [0, 280, 280], opacity: [0, 0.9, 0.6] }}
        transition={{ duration: 2, delay: 2.2 }}
      />
      {/* Mushroom cap */}
      <motion.div
        className="absolute left-1/2 rounded-full"
        style={{
          width: 360, height: 240, marginLeft: -180, top: "25%",
          background: "radial-gradient(ellipse at center 30%, #fff 0%, #ffb347 30%, #c44a1a 60%, #4a1700 100%)",
          filter: "blur(2px)",
          boxShadow: "0 0 80px 30px rgba(180,60,0,0.5)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1.8], opacity: [0, 1, 0.7] }}
        transition={{ duration: 2.2, delay: 2.3, ease: "easeOut" }}
      />
    </Layer>
  );
};

// 5. EAGLE 500KG ----------------------------------------------------------
const Eagle500Victory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3500);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <Layer>
      {/* Falling bomb */}
      <motion.img
        src={eagle500Svg}
        alt=""
        className="absolute"
        style={{ width: 140, height: 140, left: "50%", marginLeft: -70, top: "45%", filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.7))" }}
        initial={{ y: -window.innerHeight, opacity: 1, rotate: -10 }}
        animate={{ y: [-window.innerHeight, 0, 0], opacity: [1, 1, 0], rotate: [-10, 5, 0] }}
        transition={{ duration: 1.1, times: [0, 0.9, 1] }}
      />
      {/* Initial fireball */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: 200,
          height: 200,
          marginLeft: -100,
          marginTop: -100,
          background: "radial-gradient(circle, #fff 0%, #ffd54a 25%, #ff6a00 55%, #8b1100 100%)",
          boxShadow: "0 0 80px 40px rgba(255,140,0,0.75)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 4, 7, 9], opacity: [0, 1, 0.9, 0] }}
        transition={{ duration: 2.2, delay: 1.0, times: [0, 0.3, 0.7, 1], ease: "easeOut" }}
      />
      {/* Mushroom stem */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "20%",
          width: 70,
          height: 0,
          background: "linear-gradient(to top, #6b3a1a, #c2693b, #f0a86a)",
          borderRadius: 20,
          filter: "blur(3px)",
        }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: [0, 180, 180], opacity: [0, 0.9, 0.6] }}
        transition={{ duration: 2, delay: 1.4 }}
      />
      {/* Mushroom cap — top = 80% - stemHeight(180) - capHeight(170) = calc(80% - 350px) */}
      <motion.div
        className="absolute left-1/2 rounded-full"
        style={{
          width: 260,
          height: 170,
          marginLeft: -130,
          top: "calc(80% - 350px)",
          background: "radial-gradient(ellipse at center 30%, #fff 0%, #ffb347 30%, #c44a1a 60%, #4a1700 100%)",
          filter: "blur(2px)",
          boxShadow: "0 0 60px 20px rgba(180,60,0,0.5)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.0, 1.2], opacity: [0, 1, 0.7] }}
        transition={{ duration: 2.2, delay: 1.6, ease: "easeOut" }}
      />
    </Layer>
  );
};

// 6. ORBITAL LASER --------------------------------------------------------
const OrbitalLaserVictory = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 3500);
    return () => clearTimeout(t);
  }, [onComplete]);

  // S-curve waypoints (% of viewport width)
  const xs = [20, 80, 30, 75, 25, 80];

  return (
    <Layer>
      {/* Beam */}
      <motion.div
        className="absolute top-0 bottom-0"
        style={{
          width: 60,
          marginLeft: -30,
          background: "linear-gradient(to bottom, rgba(255,255,180,0), #fff700 10%, #fff 50%, #fff700 90%, rgba(255,255,180,0))",
          boxShadow: "0 0 60px 30px rgba(255,230,0,0.9), 0 0 120px 60px rgba(255,160,0,0.5)",
          filter: "blur(1px)",
        }}
        initial={{ left: `${xs[0]}%`, opacity: 0, scaleY: 0 }}
        animate={{
          left: xs.map((x) => `${x}%`),
          opacity: [0, 1, 1, 1, 1, 0],
          scaleY: [0, 1, 1, 1, 1, 1],
        }}
        transition={{ duration: 3, times: [0, 0.1, 0.3, 0.55, 0.85, 1], ease: "easeInOut" }}
      />
      {/* Scorched trail using SVG path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d={`M ${xs[0]} 0 C ${xs[1]} 25, ${xs[2]} 45, ${xs[3]} 60 S ${xs[4]} 85, ${xs[5]} 100`}
          stroke="url(#scorchGrad)"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,80,0,0.9))" }}
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={{ duration: 3.4, times: [0, 0.85, 1] }}
        />
        <defs>
          <linearGradient id="scorchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff700" />
            <stop offset="50%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#3a0000" />
          </linearGradient>
        </defs>
      </svg>
      {/* Smouldering embers along trail */}
      {xs.map((x, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${x}%`, top: `${(i / (xs.length - 1)) * 100}%`, fontSize: 40, marginLeft: -20 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.4, 1, 0.8] }}
          transition={{ duration: 2, delay: 0.5 + i * 0.4 }}
        >
          🔥
        </motion.div>
      ))}
    </Layer>
  );
};

export const HelldiversVictory = ({ winningNumber, onComplete }: Props) => {
  const calledRef = useRef(false);
  const handleComplete = () => {
    if (calledRef.current) return;
    calledRef.current = true;
    onComplete();
  };

  return (
    <AnimatePresence>
      {winningNumber === 1 && <NapalmVictory key="1" onComplete={handleComplete} />}
      {winningNumber === 2 && <BastionVictory key="2" onComplete={handleComplete} />}
      {winningNumber === 3 && <AutocannonVictory key="3" onComplete={handleComplete} />}
      {winningNumber === 4 && <HellbombVictory key="4" onComplete={handleComplete} />}
      {winningNumber === 5 && <Eagle500Victory key="5" onComplete={handleComplete} />}
      {winningNumber === 6 && <OrbitalLaserVictory key="6" onComplete={handleComplete} />}
    </AnimatePresence>
  );
};
