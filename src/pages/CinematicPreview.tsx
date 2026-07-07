import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SieniVictory } from "@/components/victory/SieniVictory";
import { HelldiversVictory } from "@/components/victory/HelldiversVictory";
import { sieniFaceIcons, helldiversFaceIcons } from "@/components/Dice";

type Cinematic = "sieni" | "helldivers";

const sieniFaces = [
  { face: 1, name: "Kantarelli", note: "Golden harvest + SUIII" },
  { face: 2, name: "Suppilovahvero", note: "Autumn rain & leaves" },
  { face: 3, name: "Herkkutatti", note: "Regal king fanfare" },
  { face: 4, name: "Korvasieni", note: "Toxic danger warning" },
  { face: 5, name: "Mustatorvisieni", note: "Ominous dark smoke" },
  { face: 6, name: "Kärpässieni", note: "Psychedelic trip" },
];

const helldiversFaces = [
  { face: 1, name: "Napalm" },
  { face: 2, name: "Bastion" },
  { face: 3, name: "Autocannon" },
  { face: 4, name: "Hellbomb" },
  { face: 5, name: "Eagle 500KG" },
  { face: 6, name: "Orbital Laser" },
];

const CinematicPreview = () => {
  const [active, setActive] = useState<{ type: Cinematic; face: number } | null>(null);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Game</span>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Victory Cinematic Preview</h1>
          <p className="text-muted-foreground">
            Click any face to play its full-screen win cinematic. It plays once and dismisses itself.
          </p>
        </div>

        {/* Suomen Sienet */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">🍄 Suomen Sienet</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sieniFaces.map((m) => (
              <button
                key={m.face}
                onClick={() => setActive({ type: "sieni", face: m.face })}
                className="p-4 rounded-lg border-2 border-amber-700/40 bg-background hover:bg-muted/50 hover:border-amber-700/70 transition-all flex flex-col items-center gap-2 text-center"
              >
                <img src={sieniFaceIcons[m.face]} alt="" className="w-12 h-12 object-contain" draggable={false} />
                <span className="text-sm font-medium">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.note}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Helldivers */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">🪖 Helldivers Stratagems</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {helldiversFaces.map((h) => (
              <button
                key={h.face}
                onClick={() => setActive({ type: "helldivers", face: h.face })}
                className="p-4 rounded-lg border-2 border-red-700/40 bg-black hover:border-red-700/70 transition-all flex flex-col items-center gap-2 text-center"
              >
                <img src={helldiversFaceIcons[h.face]} alt="" className="w-12 h-12 object-contain" draggable={false} />
                <span className="text-sm font-medium text-white">{h.name}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Cinematic overlays — keyed so re-selecting the same face replays it */}
      {active?.type === "sieni" && (
        <SieniVictory
          key={`sieni-${active.face}`}
          winningNumber={active.face}
          onComplete={() => setActive(null)}
        />
      )}
      {active?.type === "helldivers" && (
        <HelldiversVictory
          key={`hd-${active.face}`}
          winningNumber={active.face}
          onComplete={() => setActive(null)}
        />
      )}
    </div>
  );
};

export default CinematicPreview;
