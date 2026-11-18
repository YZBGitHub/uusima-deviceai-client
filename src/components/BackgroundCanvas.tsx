export function BackgroundCanvas() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Top sky-blue to crisp white wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #DCE7FD 0%, #E7EFFE 14%, #F4F7FF 34%, #FAFBFF 62%, #F8F9FE 100%)",
        }}
      />

      {/* Subtle bottom flowing lavender/periwinkle silky wave mesh */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[260px] md:h-[310px]"
        viewBox="0 0 1920 320"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="waveRibbonA" x1="0" y1="0" x2="1920" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDE6FF" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#ECE6FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E6DCFF" stopOpacity="0.65" />
          </linearGradient>
          <linearGradient id="waveRibbonB" x1="1920" y1="0" x2="0" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2D9FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#EDE9FE" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#DCE6FF" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {/* Soft broad wave fills */}
        <path
          d="M0 155 C 320 65, 620 110, 960 195 C 1320 285, 1620 265, 1920 155 L 1920 320 L 0 320 Z"
          fill="url(#waveRibbonA)"
        />
        <path
          d="M0 205 C 380 120, 740 250, 1180 220 C 1520 195, 1740 120, 1920 140 L 1920 320 L 0 320 Z"
          fill="url(#waveRibbonB)"
        />
        <path
          d="M0 255 C 460 185, 860 285, 1340 235 C 1600 208, 1780 180, 1920 200 L 1920 320 L 0 320 Z"
          fill="#F5F3FF"
          fillOpacity="0.65"
        />

        {/* Delicate parallel mesh contour lines */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
          const offset = idx * 10;
          return (
            <path
              key={idx}
              d={`M0 ${182 + offset} C 360 ${105 + offset * 0.7}, 760 ${240 - offset * 0.4}, 1220 ${205 + offset * 0.5} C 1550 ${180 + offset * 0.6}, 1760 ${135 + offset * 0.8}, 1920 ${152 + offset}`}
              stroke="#C7D2FE"
              strokeOpacity={0.32 - idx * 0.03}
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}
