// Gold coin fountains built on canvas-confetti (already used for wins).

const GOLD = ["#fde68a", "#facc15", "#eab308", "#ca8a04", "#fff7cc"];

export async function coinBurst(origin: { x: number; y: number } = { x: 0.5, y: 0.6 }, particleCount = 60) {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount,
    startVelocity: 38,
    spread: 70,
    gravity: 1.1,
    scalar: 1.3,
    shapes: ["circle"],
    colors: GOLD,
    origin,
    zIndex: 80,
  });
}

export async function goldRain(durationMs = 2500) {
  const confetti = (await import("canvas-confetti")).default;
  const end = Date.now() + durationMs;
  const frame = () => {
    confetti({
      particleCount: 6,
      startVelocity: 10,
      spread: 160,
      gravity: 0.8,
      scalar: 1.4,
      shapes: ["circle"],
      colors: GOLD,
      origin: { x: Math.random(), y: -0.1 },
      zIndex: 80,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
