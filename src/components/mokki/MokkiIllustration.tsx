/**
 * Hand-drawn isometric mökki in SVG: shop preview and no-WebGL fallback.
 * Animated smoke and water ripples; no three.js.
 */
export const MokkiIllustration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 150" className={className} role="img" aria-label="A red mökki on a little island">
    <style>{`
      @keyframes mi-smoke { 0% { transform: translate(0,0) scale(.4); opacity: 0 } 20% { opacity: .8 } 100% { transform: translate(10px,-34px) scale(1.4); opacity: 0 } }
      @keyframes mi-ripple { 0%,100% { transform: scaleX(1); opacity: .5 } 50% { transform: scaleX(1.08); opacity: .9 } }
      @keyframes mi-sway { 0%,100% { transform: rotate(-1.5deg) } 50% { transform: rotate(1.5deg) } }
      .mi-smoke { animation: mi-smoke 3.2s ease-out infinite; transform-box: fill-box; transform-origin: center }
      .mi-ripple { animation: mi-ripple 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center }
      .mi-sway { animation: mi-sway 5s ease-in-out infinite; transform-box: fill-box; transform-origin: bottom center }
    `}</style>

    {/* Lake with a cut-away edge */}
    <ellipse cx="100" cy="112" rx="94" ry="36" fill="#5a4330" />
    <ellipse cx="100" cy="106" rx="94" ry="36" fill="#2f6f8f" />
    <ellipse cx="100" cy="104" rx="94" ry="36" fill="#3a83a6" />
    <ellipse className="mi-ripple" cx="40" cy="118" rx="14" ry="2" fill="none" stroke="#bfe3f2" strokeWidth="1" />
    <ellipse className="mi-ripple" cx="160" cy="122" rx="18" ry="2.4" fill="none" stroke="#bfe3f2" strokeWidth="1" style={{ animationDelay: "1.5s" }} />
    <ellipse className="mi-ripple" cx="150" cy="80" rx="10" ry="1.6" fill="none" stroke="#bfe3f2" strokeWidth="1" style={{ animationDelay: "0.8s" }} />

    {/* Island: granite rim + grass */}
    <ellipse cx="100" cy="99" rx="62" ry="25" fill="#9c8f87" />
    <ellipse cx="100" cy="95" rx="58" ry="22" fill="#6ea44f" />
    <ellipse cx="140" cy="110" rx="7" ry="3.5" fill="#a8958c" />
    <ellipse cx="52" cy="104" rx="6" ry="3" fill="#8d8680" />

    {/* Dock */}
    <polygon points="146,96 186,118 180,121 140,99" fill="#b98c58" />
    <polygon points="140,99 180,121 180,123 140,101" fill="#8c6339" />

    {/* Pine */}
    <g className="mi-sway">
      <rect x="51" y="82" width="3" height="10" fill="#6a4a2e" />
      <polygon points="52.5,52 42,74 63,74" fill="#2b573a" />
      <polygon points="52.5,62 40,86 65,86" fill="#335f40" />
    </g>

    {/* Cabin: back roof slope */}
    <polygon points="100,50 129.4,67 119,51 89.6,34" fill="#24262b" />
    {/* Walls */}
    <polygon points="79.2,86 108.6,103 108.6,79 79.2,62" fill="#8e2a1e" />
    <polygon points="108.6,103 129.4,91 129.4,67 108.6,79" fill="#6f2016" />
    {/* Gable */}
    <polygon points="108.6,79 129.4,67 119,51" fill="#7a2418" />
    {/* Front roof slope */}
    <polygon points="76,63 110,82.5 120.5,57 86.5,37.5" fill="#33353b" />
    <polyline points="76,63 110,82.5" stroke="#f4efe3" strokeWidth="1.5" />
    {/* White corner boards */}
    <line x1="79.2" y1="86" x2="79.2" y2="62" stroke="#f4efe3" strokeWidth="2" />
    <line x1="108.6" y1="103" x2="108.6" y2="80" stroke="#f4efe3" strokeWidth="2" />
    <line x1="129.4" y1="91" x2="129.4" y2="68" stroke="#f4efe3" strokeWidth="2" />
    {/* Windows (warm) and door */}
    <polygon points="83,77 91,81.6 91,73.6 83,69" fill="#f4efe3" />
    <polygon points="84,76 90,79.5 90,74.3 84,70.6" fill="#ffcc6e" />
    <polygon points="96,90.5 103,94.5 103,82.5 96,78.5" fill="#3d5a45" stroke="#f4efe3" strokeWidth="1" />
    <polygon points="114,92 122,87.4 122,79.4 114,84" fill="#f4efe3" />
    <polygon points="115,91 121,87.5 121,80.2 115,83.6" fill="#ffcc6e" />
    {/* Chimney + smoke */}
    <polygon points="97,46 101,48.3 101,38 97,35.7" fill="#9b4a33" />
    <polygon points="101,48.3 104,46.6 104,36.3 101,38" fill="#7d3a28" />
    {[0, 1.05, 2.1].map((d) => (
      <circle key={d} className="mi-smoke" cx="101" cy="31" r="4" fill="#ece9e4" style={{ animationDelay: `${d}s` }} />
    ))}

    {/* Birch */}
    <g className="mi-sway" style={{ animationDelay: "1s" }}>
      <rect x="152" y="70" width="3" height="26" fill="#efece6" />
      <rect x="152" y="76" width="2" height="1.5" fill="#2a2826" />
      <rect x="153" y="84" width="2" height="1.5" fill="#2a2826" />
      <circle cx="153.5" cy="64" r="9" fill="#7fbf5a" />
      <circle cx="147" cy="70" r="6" fill="#6aa84f" />
      <circle cx="160" cy="69" r="6.5" fill="#5c9a45" />
    </g>
  </svg>
);
