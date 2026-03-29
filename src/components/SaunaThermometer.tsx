const toRad = (deg: number) => (deg * Math.PI) / 180;

interface SaunaThermometerProps {
  throwCount: number;
  heatLevel: number;
  /** Display size in px — the SVG scales to this width/height (default 52) */
  size?: number;
}

export const SaunaThermometer = ({ throwCount, heatLevel, size = 52 }: SaunaThermometerProps) => {
  const isMax = heatLevel >= 3;
  const fraction = Math.min(throwCount / 20, 1);
  const cx = 50, cy = 50, r = 34;

  const pt = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });
  const A = pt(120); // 7 o'clock — cold start
  const B = pt(270); // 12 o'clock — 50% (10 throws)
  const C = pt(345); // ~1 o'clock — 75% (15 throws)
  const D = pt(60);  // 5 o'clock — hot end

  const activeAngleDeg = 120 + fraction * 300;
  const E = pt(activeAngleDeg);
  const largeArc = fraction * 300 > 180 ? 1 : 0;

  const nl = 22;
  const nx = cx + nl * Math.cos(toRad(activeAngleDeg));
  const ny = cy + nl * Math.sin(toRad(activeAngleDeg));

  const fillColor = isMax
    ? "rgba(248,113,113,1)"
    : fraction >= 0.75 ? "rgba(252,165,165,0.95)"
    : fraction >= 0.5  ? "rgba(253,224,71,0.95)"
    : "rgba(147,197,253,0.95)";

  const needleColor = isMax ? "#f87171" : "white";
  const pinColor    = isMax ? "#f87171" : "white";

  const f = (n: number) => n.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={`Sauna heat: ${isMax ? "MAXIMUM" : Math.round(fraction * 100) + "%"}`}>
      <svg viewBox="0 0 100 100" width={size} height={size}
        style={isMax ? { filter: "drop-shadow(0 0 6px rgba(248,113,113,0.9))" } : undefined}>

        {/* Zone tracks (dim) */}
        <path d={`M ${f(A.x)} ${f(A.y)} A ${r} ${r} 0 0 1 ${f(B.x)} ${f(B.y)}`}
          fill="none" stroke="rgba(147,197,253,0.25)" strokeWidth="7" strokeLinecap="round" />
        <path d={`M ${f(B.x)} ${f(B.y)} A ${r} ${r} 0 0 1 ${f(C.x)} ${f(C.y)}`}
          fill="none" stroke="rgba(253,224,71,0.25)" strokeWidth="7" strokeLinecap="round" />
        <path d={`M ${f(C.x)} ${f(C.y)} A ${r} ${r} 0 0 1 ${f(D.x)} ${f(D.y)}`}
          fill="none" stroke="rgba(252,165,165,0.25)" strokeWidth="7" strokeLinecap="round" />

        {/* Active fill */}
        {isMax ? (
          <path d={`M ${f(A.x)} ${f(A.y)} A ${r} ${r} 0 1 1 ${f(D.x)} ${f(D.y)}`}
            fill="none" stroke={fillColor} strokeWidth="7" strokeLinecap="round" />
        ) : fraction > 0.002 ? (
          <path d={`M ${f(A.x)} ${f(A.y)} A ${r} ${r} 0 ${largeArc} 1 ${f(E.x)} ${f(E.y)}`}
            fill="none" stroke={fillColor} strokeWidth="7" strokeLinecap="round" />
        ) : null}

        {/* Tick marks at 10 and 15 throws */}
        <line x1={f(B.x)} y1={f(B.y)} x2={f(cx + (r + 5) * Math.cos(toRad(270)))} y2={f(cy + (r + 5) * Math.sin(toRad(270)))}
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={f(C.x)} y1={f(C.y)} x2={f(cx + (r + 5) * Math.cos(toRad(345)))} y2={f(cy + (r + 5) * Math.sin(toRad(345)))}
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Needle */}
        <line x1={cx} y1={cy} x2={f(nx)} y2={f(ny)}
          stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Centre pin */}
        <circle cx={cx} cy={cy} r="4" fill={pinColor} />

        {/* Cold / Hot endpoint labels */}
        <text x={f(A.x - 2)} y={f(A.y + 10)} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace">❄</text>
        <text x={f(D.x + 2)} y={f(D.y + 10)} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace">🔥</text>
      </svg>

      <span className={`text-[10px] uppercase tracking-widest font-mono font-bold transition-colors ${isMax ? "text-red-400" : "text-white/75"}`}>
        {isMax ? "MAX LÖYLY" : "LÖYLY"}
      </span>
    </div>
  );
};
