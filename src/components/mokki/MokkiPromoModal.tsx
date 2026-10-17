import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { MOKKI_PLOT_ID } from "@/lib/kymppijape";
import { shopItems } from "@/lib/shopItems";
import island from "@/assets/promo/mokki/island.webp";
import walk from "@/assets/promo/mokki/walk.webp";
import tree from "@/assets/promo/mokki/tree.webp";
import chores from "@/assets/promo/mokki/chores.webp";
import shore from "@/assets/promo/mokki/shore.webp";

const PLOT_PRICE = shopItems.find((item) => item.id === MOKKI_PLOT_ID)?.price ?? 1000;

interface Slide {
  id: string;
  image: string;
  alt: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: "island",
    image: island,
    alt: "A 3D lakeside mökki: cabin, sauna, dock and flag, with the Walk around button",
    title: "Your own lake",
    body: "A living mökki in 3D. Seasons turn, and the sauna smokes on days you play.",
  },
  {
    id: "walk",
    image: walk,
    alt: "First-person walk mode on the mökki, standing on the grass in front of the cabin",
    title: "Walk around",
    body: "Step onto the island. Walk up to the fire, the dock, the sauna — and tap them.",
  },
  {
    id: "tree",
    image: tree,
    alt: "The Rakennuspuu tech tree, with eras from Kesämökki to Legenda and build nodes",
    title: "Climb the Rakennuspuu",
    body: "A Civ-style tree. Fire ring, sauna, dog, palju — each piece finishes as you play.",
  },
  {
    id: "chores",
    image: chores,
    alt: "Today's chore tray over the island: grill, fish, sauna turn, berries and the dog",
    title: "Chores pay you back",
    body: "Grill a makkara, go fishing, scratch the dog. Once a day, after today's game.",
  },
  {
    id: "shore",
    image: shore,
    alt: "The mökki shore: rantasauna, palju, dock and rowboat on the lake",
    title: "The lake is waiting",
    body: "Rantasauna, palju, a dock. Buy the plot, then build the rest by playing.",
  },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface MokkiPromoModalProps {
  open: boolean;
  /** Player already bought the Mökkitontti. */
  ownsPlot: boolean;
  onDismiss: () => void;
}

/** One-time carousel pitching the current Mökki. Dismiss, skip, or the CTA all count as seen. */
export const MokkiPromoModal = ({ open, ownsPlot, onDismiss }: MokkiPromoModalProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const onKeyDownCapture = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        api?.scrollNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        api?.scrollPrev();
      }
    },
    [api],
  );

  const goToMokki = () => {
    onDismiss();
    navigate("/mokki");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onDismiss(); }}>
      <DialogContent
        className="max-w-md gap-3 p-4 motion-reduce:animate-none sm:p-5"
        aria-modal="true"
        data-reduced-motion={reduced ? "true" : "false"}
        onKeyDownCapture={onKeyDownCapture}
      >
        <div className="flex items-center pr-6">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" onClick={onDismiss}>
            Skip
          </Button>
        </div>

        <Carousel
          key={reduced ? "still" : "move"}
          setApi={setApi}
          opts={{ duration: reduced ? 0 : 22, watchDrag: true }}
          className="w-full"
          aria-label="Mökki promo"
        >
          <CarouselContent className="ml-0">
            {SLIDES.map((item, i) => (
              <CarouselItem key={item.id} className="pl-0" aria-label={`${i + 1} of ${SLIDES.length}: ${item.title}`}>
                <img
                  src={item.image}
                  alt={i === index ? item.alt : ""}
                  width={960}
                  height={600}
                  className="aspect-[16/10] w-full rounded-md bg-muted object-cover"
                  draggable={false}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 top-1/2 border-white/80 bg-white/90 text-slate-900 hover:bg-white" />
          <CarouselNext className="right-2 top-1/2 border-white/80 bg-white/90 text-slate-900 hover:bg-white" />
        </Carousel>

        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-display text-2xl leading-tight">{slide.title}</DialogTitle>
          <DialogDescription>
            {ownsPlot && last ? "Your mökki is unlocked. Go take a walk." : slide.body}
          </DialogDescription>
        </DialogHeader>

        <div className="sr-only" aria-live="polite">
          Slide {index + 1} of {SLIDES.length}: {slide.title}. {ownsPlot && last ? "Your mökki is unlocked. Go take a walk." : slide.body}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-current={i === index ? "true" : undefined}
              aria-label={`Show slide ${i + 1}: ${item.title}`}
              className="flex h-8 w-8 items-center justify-center"
              onClick={() => api?.scrollTo(i)}
            >
              <span
                className={`h-2 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                  i === index ? "w-5 bg-primary" : "w-2 bg-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        {last ? (
          <Button className="w-full" onClick={goToMokki}>
            {ownsPlot ? "Open your mökki" : "Go to the mökki"}
          </Button>
        ) : (
          <Button className="w-full" onClick={() => api?.scrollNext()}>
            Next
          </Button>
        )}
        {!ownsPlot && last && (
          <p className="text-center text-xs text-muted-foreground">Mökkitontti · {PLOT_PRICE} credits in the shop</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
