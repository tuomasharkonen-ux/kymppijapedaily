import { useMemo } from "react";

const STAR_COUNT = 100;
const COLORS = [
  { bg: "hsl(0,0%,100%)", shadow: "hsl(0,0%,100%/0.6)" },
  { bg: "hsl(210,80%,90%)", shadow: "hsl(210,80%,80%/0.6)" },
  { bg: "hsl(50,80%,90%)", shadow: "hsl(50,80%,80%/0.6)" },
  { bg: "hsl(280,60%,90%)", shadow: "hsl(280,60%,85%/0.5)" },
];

export const TwinkleStars = () => {
  const stars = useMemo(() => {
    const seeded: { top: number; left: number; size: number; color: number; duration: number; delay: number }[] = [];
    // Use deterministic pseudo-random for consistent layout
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < STAR_COUNT; i++) {
      seeded.push({
        top: rand() * 100,
        left: rand() * 100,
        size: rand() > 0.8 ? 3 : 2,
        color: rand() > 0.85 ? Math.floor(rand() * 3) + 1 : 0,
        duration: 2 + rand() * 2.5,
        delay: rand() * 3,
      });
    }
    return seeded;
  }, []);

  return (
    <div className="twinkle-stars">
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: COLORS[s.color].bg,
            boxShadow: s.size === 3 ? `0 0 6px 2px ${COLORS[s.color].shadow}` : `0 0 4px 1px ${COLORS[s.color].shadow}`,
            animation: `${i % 2 === 0 ? "star-twinkle-1" : "star-twinkle-2"} ${s.duration}s ease-in-out infinite ${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
