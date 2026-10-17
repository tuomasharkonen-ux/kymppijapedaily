import { Footprints } from "lucide-react";

/** The big "walk around" call to action on the full-screen mökki (labelled on every screen size). */
export const WalkButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="pointer-events-auto relative flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg ring-2 ring-white/80 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white active:scale-95"
  >
    {/* A few soft pulses so it gets noticed, then it stays calm */}
    <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/50 motion-safe:animate-[ping_2.2s_ease-out_3]" aria-hidden="true" />
    <Footprints className="h-5 w-5" aria-hidden="true" />
    <span>Walk around</span>
  </button>
);
