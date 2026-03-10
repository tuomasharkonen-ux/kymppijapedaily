import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackgroundFullPreviewProps {
  backgroundId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundFullPreview = ({ backgroundId, isOpen, onClose }: BackgroundFullPreviewProps) => {
  if (!isOpen) return null;

  const bgClass = backgroundId === "casino_felt_bg" ? "casino-felt-bg" : backgroundId === "starfield_bg" ? "starfield-bg" : "";

  const diceValues = backgroundId === "casino_felt_bg" ? [3, 5, 6] : [2, 4, 1];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Full-screen background */}
      <div className={`absolute inset-0 ${bgClass}`} />

      {/* Close button */}
      <div className="relative z-10 flex justify-end p-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="rounded-full bg-background/80 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Mock game content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <p className="text-sm font-medium text-foreground/70 bg-background/30 backdrop-blur-sm px-4 py-2 rounded-full">
          Background Preview
        </p>

        {/* Mock dice */}
        <div className="flex items-center justify-center gap-4">
          {diceValues.map((val, i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-xl bg-background/90 border border-border flex items-center justify-center font-bold text-foreground text-2xl shadow-lg"
            >
              {val}
            </div>
          ))}
        </div>

        {/* Mock game info */}
        <div className="flex gap-3">
          <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-foreground/80">
            Throw 2 / 3
          </div>
          <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-foreground/80">
            Target: 421
          </div>
        </div>
      </div>
    </div>
  );
};
