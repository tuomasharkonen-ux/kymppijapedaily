import { useEffect, useState } from "react";

interface BackgroundPreviewProps {
  backgroundId: string;
}

export const BackgroundPreview = ({ backgroundId }: BackgroundPreviewProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (backgroundId === "casino_felt_bg") {
    return (
      <div className="relative w-full h-32 rounded-lg overflow-hidden casino-felt-bg">
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {[3, 5, 6].map((val) => (
            <div
              key={val}
              className="w-10 h-10 rounded-lg bg-background/90 border border-border flex items-center justify-center font-bold text-foreground text-lg shadow-md"
            >
              {val}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (backgroundId === "starfield_bg") {
    return (
      <div className="relative w-full h-32 rounded-lg overflow-hidden starfield-bg">
        <TwinkleStars />
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          {[2, 4, 1].map((val) => (
            <div
              key={val}
              className="w-10 h-10 rounded-lg bg-background/90 border border-border flex items-center justify-center font-bold text-foreground text-lg shadow-md"
            >
              {val}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
