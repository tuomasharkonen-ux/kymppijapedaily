import { useMemo } from "react";
import type { MokkiEnvironment } from "./environment";

const STAR_COUNT = 70;

function rand(seed: number) {
  const x = Math.sin(seed * 91.7 + 12.3) * 43758.5453;
  return x - Math.floor(x);
}

/** Sky layer rendered behind the transparent WebGL canvas. */
export const SkyBackdrop = ({ env }: { env: MokkiEnvironment }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        left: rand(i) * 100,
        top: rand(i + 100) * 62,
        size: 1 + rand(i + 200) * 1.8,
        delay: rand(i + 300) * 4,
        duration: 2 + rand(i + 400) * 3,
      })),
    [],
  );

  const showSun = env.timeOfDay === "golden" || env.timeOfDay === "day";
  const night = env.timeOfDay === "night";

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${env.skyTop} 0%, ${env.skyBottom} 78%)` }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes mokki-twinkle { 0%, 100% { opacity: 0.25 } 50% { opacity: 1 } }
        @keyframes mokki-aurora {
          0% { transform: translateX(-6%) skewX(-8deg) scaleY(1); opacity: 0.55 }
          50% { transform: translateX(5%) skewX(6deg) scaleY(1.15); opacity: 0.9 }
          100% { transform: translateX(-6%) skewX(-8deg) scaleY(1); opacity: 0.55 }
        }
        @keyframes mokki-cloud { from { transform: translateX(-30%) } to { transform: translateX(130%) } }
      `}</style>

      {env.stars &&
        stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animation: `mokki-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}

      {env.aurora && (
        <div className="absolute inset-x-0 top-0 h-[70%]" style={{ filter: "blur(18px)", mixBlendMode: "screen" }}>
          {[
            { top: "6%", color: "rgba(80, 255, 170, 0.55)", rot: -8, dur: 14 },
            { top: "16%", color: "rgba(60, 220, 160, 0.45)", rot: 6, dur: 18 },
            { top: "2%", color: "rgba(170, 110, 255, 0.35)", rot: -3, dur: 22 },
          ].map((band, i) => (
            <div
              key={i}
              className="absolute left-[-15%] w-[130%]"
              style={{
                top: band.top,
                height: "34%",
                background: `linear-gradient(to bottom, transparent 0%, ${band.color} 45%, transparent 100%)`,
                borderRadius: "50%",
                transform: `rotate(${band.rot}deg)`,
                animation: `mokki-aurora ${band.dur}s ease-in-out ${i * 2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {showSun && (
        <div
          className="absolute rounded-full"
          style={{
            right: "12%",
            top: env.timeOfDay === "golden" ? "30%" : "8%",
            width: 70,
            height: 70,
            background: "radial-gradient(circle, rgba(255,250,225,1) 0%, rgba(255,236,170,0.7) 30%, rgba(255,220,140,0) 70%)",
          }}
        />
      )}

      {night && (
        <div
          className="absolute rounded-full"
          style={{
            left: "14%",
            top: "10%",
            width: 26,
            height: 26,
            background: "#f4f1e3",
            boxShadow: "0 0 24px 8px rgba(240, 236, 210, 0.25), inset -7px -3px 0 0 rgba(200, 196, 180, 0.6)",
          }}
        />
      )}

      {/* A couple of slow clouds on bright days */}
      {env.timeOfDay === "day" &&
        [0, 1].map((i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: `${10 + i * 14}%`,
              left: 0,
              width: "100%",
              animation: `mokki-cloud ${90 + i * 40}s linear ${-i * 45}s infinite`,
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: 120 - i * 30,
                height: 26 - i * 6,
                background: "rgba(255,255,255,0.75)",
                filter: "blur(4px)",
                boxShadow: "30px -10px 0 4px rgba(255,255,255,0.7)",
              }}
            />
          </div>
        ))}
    </div>
  );
};
