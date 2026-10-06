import { MokkiIllustration } from "./MokkiIllustration";

// Shop preview for the Mökkitontti: a lightweight animated SVG (no three.js download).
export const MokkiPreview = () => (
  <div className="w-56 overflow-hidden rounded-xl bg-gradient-to-b from-sky-300 to-sky-100" aria-hidden="true">
    <MokkiIllustration className="block w-full" />
  </div>
);
