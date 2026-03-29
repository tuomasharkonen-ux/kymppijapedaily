/** Ambient steam wisps that fill the game container at heat level 1+ */
export const SaunaSteamOverlay = ({ level }: { level: number }) => {
  if (level === 0) return null;

  const positions =
    level >= 3 ? [2, 10, 19, 29, 39, 50, 61, 71, 81, 90, 97]
    : level >= 2 ? [4, 14, 25, 37, 50, 62, 73, 84, 94]
    : [8, 30, 55, 80];

  const steamColor =
    level >= 3
      ? "linear-gradient(to top, rgba(255,200,200,0), rgba(255,180,180,0.18), rgba(255,200,200,0))"
      : "linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.14), rgba(255,255,255,0))";

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 3, overflow: "hidden", borderRadius: "inherit" }}
    >
      {positions.map((left, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${left}%`,
            width: level >= 3 ? "22%" : level >= 2 ? "24%" : "20%",
            height: level >= 3 ? "70%" : "55%",
            borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
            background: steamColor,
            filter: `blur(${level >= 3 ? 16 : 14}px)`,
            animation: `sauna-steam-rise ${2.0 + (i % 3) * 0.45}s ease-out infinite`,
            animationDelay: `${(i * 0.32) % 2.2}s`,
          }}
        />
      ))}
    </div>
  );
};
