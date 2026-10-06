import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, playSound, setSoundEnabled } from "@/lib/sound";

export const SoundToggle = ({ className = "" }: { className?: string }) => {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  return (
    <button
      type="button"
      onClick={() => {
        setSoundEnabled(!enabled);
        setEnabled(!enabled);
        if (!enabled) playSound("coin");
      }}
      className={`rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white ${className}`}
      aria-label={enabled ? "Mute sounds" : "Unmute sounds"}
      aria-pressed={enabled}
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
};
