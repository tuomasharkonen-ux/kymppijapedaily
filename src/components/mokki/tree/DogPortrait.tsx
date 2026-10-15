import type { DogBreedId } from "@/lib/mokki";

interface DogPortraitProps {
  breed: DogBreedId;
  className?: string;
  /** Sky-and-grass backdrop behind the dog (off = transparent). */
  scenery?: boolean;
}

const SCENERY = "linear-gradient(#a9d7f5, #d8f0ff 60%, #7fbf5a 60%, #6aa94a)";

/** Ring of small circles: the curly coat used by the poodle and the lagotto. */
const Curls = ({ cx, cy, r, n, color }: { cx: number; cy: number; r: number; n: number; color: string }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r * 0.7} r={r * 0.42} fill={color} />;
    })}
  </>
);

const Poodle = () => {
  const c = "#7b4a2d";
  const d = "#5e3720";
  return (
    <>
      <ellipse cx="150" cy="128" rx="70" ry="6" fill="#0002" />
      <rect x="118" y="95" width="6" height="32" fill={c} />
      <rect x="170" y="95" width="6" height="32" fill={c} />
      <rect x="128" y="95" width="6" height="32" fill={d} />
      <rect x="180" y="95" width="6" height="32" fill={d} />
      <Curls cx={121} cy={124} r={7} n={6} color={c} />
      <Curls cx={183} cy={124} r={7} n={6} color={c} />
      <ellipse cx="150" cy="88" rx="42" ry="16" fill={c} />
      <Curls cx={188} cy={78} r={12} n={8} color={c} />
      <line x1="192" y1="80" x2="205" y2="52" stroke={c} strokeWidth="5" />
      <Curls cx={206} cy={48} r={8} n={7} color={c} />
      <rect x="106" y="58" width="12" height="30" fill={c} />
      <ellipse cx="104" cy="52" rx="15" ry="13" fill={c} />
      <Curls cx={104} cy={38} r={10} n={8} color={c} />
      <ellipse cx="88" cy="56" rx="11" ry="6" fill={c} />
      <circle cx="79" cy="55" r="3.5" fill="#222" />
      <Curls cx={114} cy={62} r={7} n={6} color={d} />
      <circle cx="98" cy="48" r="2.4" fill="#111" />
    </>
  );
};

const AUSSIE_DOTS: [number, number][] = [
  [78, 58],
  [83, 63],
  [88, 57],
  [74, 64],
  [90, 64],
  [80, 52],
  [95, 60],
];

const Aussie = () => {
  const k = "#1d1d22";
  const w = "#f4f1ea";
  return (
    <>
      <ellipse cx="150" cy="128" rx="80" ry="6" fill="#0002" />
      <rect x="112" y="92" width="10" height="35" rx="4" fill={k} />
      <rect x="180" y="92" width="10" height="35" rx="4" fill={k} />
      <rect x="124" y="92" width="10" height="35" rx="4" fill="#2b2b30" />
      <rect x="192" y="92" width="10" height="35" rx="4" fill="#2b2b30" />
      <rect x="112" y="118" width="10" height="9" fill={w} />
      <rect x="124" y="118" width="10" height="9" fill={w} />
      <ellipse cx="158" cy="84" rx="54" ry="22" fill={k} />
      <ellipse cx="212" cy="76" rx="9" ry="7" fill={k} />
      <ellipse cx="118" cy="88" rx="16" ry="14" fill={w} />
      <path d="M100 82 Q96 60 104 44 L122 70 Z" fill={k} />
      <ellipse cx="96" cy="50" rx="21" ry="18" fill={k} />
      <path d="M90 34 L100 30 L104 56 L94 56 Z" fill={w} />
      <ellipse cx="80" cy="60" rx="14" ry="8" fill={k} />
      <ellipse cx="82" cy="60" rx="11" ry="6" fill={w} />
      {AUSSIE_DOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill={w} />
      ))}
      <circle cx="68" cy="58" r="4" fill="#111" />
      <path d="M104 34 L114 22 L116 40 Z" fill={k} />
      <circle cx="94" cy="46" r="2.6" fill="#7a4a12" />
      <circle cx="94" cy="46" r="1.2" fill="#111" />
    </>
  );
};

const LAGOTTO_COAT = Array.from({ length: 34 }, (_, i) => ({
  x: 110 + (i % 11) * 9 + (Math.floor(i / 11) % 2) * 4,
  y: 72 + Math.floor(i / 11) * 9,
  dark: i % 3 === 0,
}));

const Lagotto = () => {
  const c = "#8a5a3b";
  const d = "#6f4529";
  return (
    <>
      <ellipse cx="160" cy="128" rx="80" ry="6" fill="#0002" />
      {[118, 130, 188, 200].map((x, i) => (
        <rect key={x} x={x} y="90" width="11" height="37" rx="5" fill={i % 2 ? d : c} />
      ))}
      <Curls cx={124} cy={122} r={7} n={6} color={c} />
      <Curls cx={194} cy={122} r={7} n={6} color={c} />
      <ellipse cx="160" cy="84" rx="52" ry="20" fill={c} />
      {LAGOTTO_COAT.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="7" fill={p.dark ? d : c} />
      ))}
      <Curls cx={213} cy={68} r={10} n={7} color={c} />
      <Curls cx={100} cy={50} r={16} n={10} color={c} />
      <circle cx="100" cy="50" r="15" fill={c} />
      <Curls cx={84} cy={64} r={9} n={7} color={d} />
      <ellipse cx="80" cy="56" rx="11" ry="8" fill={c} />
      <circle cx="71" cy="54" r="4" fill="#2a1a10" />
      <Curls cx={112} cy={54} r={9} n={7} color={d} />
      <circle cx="94" cy="46" r="2.6" fill="#2a1a10" />
    </>
  );
};

const LABELS: Record<DogBreedId, string> = {
  puudeli: "Brown mini poodle",
  aussi: "Black Australian shepherd with white face spots",
  lagotto: "Brown Lagotto Romagnolo",
};

/** Side-profile illustration of one of the three mökki dogs. */
export const DogPortrait = ({ breed, className, scenery = true }: DogPortraitProps) => (
  <svg
    viewBox="0 0 300 150"
    className={className}
    style={scenery ? { background: SCENERY } : undefined}
    role="img"
    aria-label={LABELS[breed]}
  >
    {breed === "puudeli" ? <Poodle /> : breed === "aussi" ? <Aussie /> : <Lagotto />}
  </svg>
);

export default DogPortrait;
