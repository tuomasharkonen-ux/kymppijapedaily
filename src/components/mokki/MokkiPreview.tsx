import { useReducedMotion } from "framer-motion";

// Shop preview for the Mökkitontti: a looping clip of the real 3D island through
// the seasons (recorded from /mokki-preview), so the shop never downloads three.js.
export const MokkiPreview = () => {
  const reduceMotion = useReducedMotion();
  const poster = "/shop/mokki-preview-poster.webp";

  return (
    <div className="w-full max-w-[320px] overflow-hidden rounded-2xl shadow-lg" aria-hidden="true">
      {reduceMotion ? (
        <img src={poster} alt="" className="block w-full" />
      ) : (
        <video
          src="/shop/mokki-preview.mp4"
          poster={poster}
          className="block w-full"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
    </div>
  );
};
