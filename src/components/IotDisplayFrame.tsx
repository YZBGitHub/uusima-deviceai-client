import { Maximize2, Minimize2, Power, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode, type RefObject } from "react";

interface IotDisplayFrameProps {
  children: ReactNode;
  screenRef: RefObject<HTMLDivElement | null>;
  onHomeClick: () => void;
}

const BRIGHTNESS_LEVELS = [100, 86, 72] as const;

function CornerScrew({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none hidden sm:flex items-center justify-center absolute w-[11px] h-[11px] rounded-full ${className}`}
      style={{
        background:
          "radial-gradient(circle at 32% 30%, #4E5869 0%, #242A35 55%, #12161E 100%)",
        boxShadow:
          "inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -1px 1.5px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,0,0,0.65)",
      }}
    >
      <svg viewBox="0 0 10 10" className="w-[6px] h-[6px] opacity-85">
        <polygon
          points="5,1.2 8.3,3.1 8.3,6.9 5,8.8 1.7,6.9 1.7,3.1"
          fill="#0B0E14"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="0.6"
        />
      </svg>
    </span>
  );
}

export function IotDisplayFrame({
  children,
  screenRef,
  onHomeClick,
}: IotDisplayFrameProps) {
  const [bezelEnabled, setBezelEnabled] = useState(true);
  const [standby, setStandby] = useState(false);
  const [brightnessIdx, setBrightnessIdx] = useState(0);
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
  const [dateText, setDateText] = useState(() =>
    new Date().toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  );

  const brightness = BRIGHTNESS_LEVELS[brightnessIdx];

  useEffect(() => {
    if (!standby) return;
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setDateText(
        now.toLocaleDateString("zh-CN", {
          month: "long",
          day: "numeric",
          weekday: "short",
        })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(timer);
  }, [standby]);

  const cycleBrightness = () => {
    if (standby) setStandby(false);
    setBrightnessIdx((prev) => (prev + 1) % BRIGHTNESS_LEVELS.length);
  };

  const toggleStandby = () => {
    setStandby((prev) => !prev);
  };

  if (!bezelEnabled) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-[#F5F7FA]">
        <div
          ref={screenRef}
          className="relative h-full w-full overflow-hidden transform-gpu"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => setBezelEnabled(true)}
          title="恢复物联网一体屏外壳效果"
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-1.5 rounded-b-lg border border-t-0 border-slate-700/80 bg-[#151A23]/92 hover:bg-[#1E2532] px-3 py-1 text-[11px] font-medium text-slate-200 shadow-lg backdrop-blur-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Minimize2 className="w-3 h-3 text-slate-300" />
          <span>恢复一体屏外壳</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-1.5 sm:p-3 md:p-4 select-none"
      style={{
        background:
          "radial-gradient(ellipse 85% 65% at 50% 0%, #1C2331 0%, #10141D 48%, #080A0F 100%)",
      }}
    >
      {/* Subtle studio desk reflection glow under chassis */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-10 h-10 opacity-45 blur-xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(15, 23, 42, 0.95) 0%, transparent 75%)",
        }}
      />

      {/* Outer CNC Anodized Aluminum Industrial HMI Chassis */}
      <div
        className="relative w-full h-full max-w-[1920px] flex flex-col rounded-[16px] sm:rounded-[22px] p-[6px] sm:p-[9px] md:p-[10px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px), linear-gradient(148deg, #434C5C 0%, #2B323F 18%, #1C212B 52%, #29303D 84%, #151921 100%)",
          boxShadow:
            "0 28px 64px -14px rgba(0, 0, 0, 0.82), 0 10px 24px -6px rgba(0, 0, 0, 0.65), inset 0 1px 0.5px rgba(255, 255, 255, 0.28), inset 1px 0 0 rgba(255, 255, 255, 0.12), inset 0 -1.5px 2px rgba(0, 0, 0, 0.75), inset -1px 0 1px rgba(0, 0, 0, 0.55)",
        }}
      >
        {/* Industrial recessed corner fasteners (IP65 panel-mount detail) */}
        <CornerScrew className="top-[5px] left-[5px] sm:top-[6px] sm:left-[6px]" />
        <CornerScrew className="top-[5px] right-[5px] sm:top-[6px] sm:right-[6px]" />
        <CornerScrew className="bottom-[5px] left-[5px] sm:bottom-[6px] sm:left-[6px]" />
        <CornerScrew className="bottom-[5px] right-[5px] sm:bottom-[6px] sm:right-[6px]" />

        {/* Left Chassis Side Heat-Dissipation Louvers */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden md:flex flex-col gap-1.5 absolute -left-[2.5px] top-1/2 -translate-y-1/2"
        >
          {[0, 1, 2, 3].map((slot) => (
            <span
              key={slot}
              className="w-[3px] h-5 rounded-l-[2px] bg-[#141820] border-l border-t border-white/10 shadow-xs"
            />
          ))}
        </div>

        {/* Right Chassis Side Physical Power Key Ridge */}
        <button
          type="button"
          onClick={toggleStandby}
          title={standby ? "唤醒屏幕" : "侧边电源键 · 息屏休眠"}
          aria-label={standby ? "唤醒屏幕" : "息屏休眠"}
          className="hidden md:block absolute -right-[3px] top-[24%] w-[4px] h-11 rounded-r-[3px] cursor-pointer transition-all hover:brightness-125 active:translate-x-[-1px]"
          style={{
            background:
              "linear-gradient(180deg, #4B5566 0%, #272E3A 50%, #171C24 100%)",
            boxShadow:
              "1px 0 2px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.22)",
          }}
        />

        {/* Flush Tempered Obsidian Glass Front Panel */}
        <div
          className="relative flex-1 min-h-0 flex flex-col rounded-[11px] sm:rounded-[14px] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #12161E 0%, #0B0E14 14%, #090C11 86%, #11151D 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 2px 6px rgba(0, 0, 0, 0.85), 0 1px 0 rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Subtle Top-Edge Tempered Glass Catchlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20"
          />

          {/* Top Bezel: Front Camera, Ambient Sensor & Dual Mic Array */}
          <div className="relative h-[22px] sm:h-[26px] shrink-0 flex items-center justify-center px-4">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Left Mic Pinhole */}
              <span
                aria-hidden="true"
                className="w-[3px] h-[3px] rounded-full bg-[#040609] ring-1 ring-white/12"
              />
              {/* Ambient Light / IR Proximity Sensor */}
              <span
                aria-hidden="true"
                className="w-[5px] h-[5px] rounded-full bg-[#070B14] ring-1 ring-slate-600/40"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, #1E293B 0%, #05070C 75%)",
                }}
              />
              {/* Optical Camera Lens Module */}
              <span
                aria-hidden="true"
                className="relative w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-full flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle at 35% 35%, #2D384B 0%, #0A0E16 70%, #04060A 100%)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 2px rgba(0,0,0,0.9)",
                }}
              >
                <span
                  className="w-[4.5px] h-[4.5px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, #60A5FA 0%, #1E3A8A 48%, #020617 100%)",
                  }}
                />
              </span>
              {/* Camera Working Micro-Indicator (subtle dormant lens) */}
              <span
                aria-hidden="true"
                className="w-[4px] h-[4px] rounded-full bg-[#111827] ring-1 ring-white/10"
              />
              {/* Right Mic Pinhole */}
              <span
                aria-hidden="true"
                className="w-[3px] h-[3px] rounded-full bg-[#040609] ring-1 ring-white/12"
              />
            </div>
          </div>

          {/* Middle Row: Left/Right Narrow Glass Borders + Active LCD Display Aperture */}
          <div className="flex-1 min-h-0 flex px-[7px] sm:px-[12px] md:px-[14px]">
            {/* Recessed LCD Active Screen Container (Containing Block for all fixed overlays!) */}
            <div
              ref={screenRef}
              className="relative flex-1 min-w-0 min-h-0 rounded-[5px] sm:rounded-[6px] overflow-hidden bg-[#F5F7FA] transform-gpu select-text"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(0, 0, 0, 0.92), 0 0 0 2px rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* Screen Brightness Wrapper */}
              <div
                className="h-full w-full transition-[filter] duration-200"
                style={{
                  filter:
                    brightness < 100 ? `brightness(${brightness / 100})` : undefined,
                }}
              >
                {children}
              </div>

              {/* Ultra-subtle inner glass edge vignette (pointer-events-none) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[5px] sm:rounded-[6px] z-30"
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.12)",
                }}
              />

              {/* Hardware Standby / Screen-Off Glass Overlay */}
              {standby && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setStandby(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setStandby(false);
                  }}
                  aria-label="轻触屏幕唤醒工业物联网一体屏"
                  className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#06090F] text-slate-200 cursor-pointer select-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, transparent 42%, transparent 65%, rgba(255,255,255,0.015) 100%)",
                  }}
                >
                  <div className="text-[52px] sm:text-[64px] font-semibold tracking-tight text-slate-100 font-mono-tabular leading-none">
                    {clockText}
                  </div>
                  <div className="mt-2.5 text-[13px] text-slate-400">
                    {dateText} · 工业物联网一体屏
                  </div>
                  <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-1.5 text-[12px] text-slate-300">
                    <Power className="w-3.5 h-3.5 text-emerald-400" />
                    <span>轻触屏幕或按下方电源键唤醒</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bezel Chin: Silkscreen Engraving, Capacitive Home Key & Hardware Strip */}
          <div className="relative h-[32px] sm:h-[36px] shrink-0 px-3 sm:px-5 flex items-center justify-between gap-2 text-[#7C8698]">
            {/* Left: Laser-Etched Industrial Chassis Silkscreen */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-[0.16em] text-[#7D8798] font-mono-tabular whitespace-nowrap">
                EDGE-HMI 1560
              </span>
              <span
                aria-hidden="true"
                className="hidden sm:inline text-[#3F4858] text-[10px]"
              >
                ·
              </span>
              <span className="hidden sm:inline text-[10px] tracking-[0.1em] text-[#5B6577] font-mono-tabular whitespace-nowrap">
                IP65 PANEL
              </span>
            </div>

            {/* Center: Recessed Capacitive Home Ring Button */}
            <button
              type="button"
              onClick={() => {
                if (standby) setStandby(false);
                onHomeClick();
              }}
              title="一体屏主控键 · 返回设备智能体"
              aria-label="返回设备智能体"
              className="group absolute left-1/2 -translate-x-1/2 inline-flex items-center justify-center w-8 h-6 rounded-md hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer focus-visible:outline-1 focus-visible:outline-slate-400"
            >
              <span className="w-4 h-4 rounded-full border border-[#5B6678] group-hover:border-slate-300 flex items-center justify-center transition-colors">
                <span className="w-1.5 h-1.5 rounded-[2px] border border-[#6E7A8E] group-hover:border-slate-200 transition-colors" />
              </span>
            </button>

            {/* Right: Hardware Status LEDs + Tactile Bezel Controls */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Micro Polycarbonate Physical LED Lenses */}
              <div className="hidden sm:flex items-center gap-2.5 pr-1">
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono-tabular tracking-wider text-[#647084]">
                  <span
                    className={`w-[5px] h-[5px] rounded-full transition-all ${
                      standby
                        ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.75)]"
                        : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    }`}
                  />
                  <span>PWR</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-mono-tabular tracking-wider text-[#647084]">
                  <span
                    className={`w-[5px] h-[5px] rounded-full transition-all ${
                      standby
                        ? "bg-slate-700"
                        : "bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.75)]"
                    }`}
                  />
                  <span>RUN</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[9.5px] font-mono-tabular tracking-wider text-[#647084]">
                  <span
                    className={`w-[5px] h-[5px] rounded-full transition-all ${
                      standby
                        ? "bg-slate-700"
                        : "bg-emerald-400/90 shadow-[0_0_5px_rgba(52,211,153,0.65)]"
                    }`}
                  />
                  <span>LAN</span>
                </span>
              </div>

              <span
                aria-hidden="true"
                className="hidden sm:block w-px h-3 bg-white/10"
              />

              {/* Hardware Bezel Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={cycleBrightness}
                  title={`屏幕亮度调节（当前 ${brightness}%）`}
                  aria-label={`调节屏幕亮度，当前 ${brightness}%`}
                  className="inline-flex items-center gap-1 px-1.5 py-1 rounded text-[10.5px] font-mono-tabular text-[#8A94A6] hover:text-slate-100 hover:bg-white/[0.07] active:scale-95 transition-all cursor-pointer"
                >
                  <Sun className="w-3.5 h-3.5" strokeWidth={1.9} />
                  <span className="hidden lg:inline">{brightness}%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBezelEnabled(false)}
                  title="切换为无边框全屏视图"
                  aria-label="切换无边框全屏视图"
                  className="inline-flex items-center justify-center p-1 rounded text-[#8A94A6] hover:text-slate-100 hover:bg-white/[0.07] active:scale-95 transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.9} />
                </button>

                <button
                  type="button"
                  onClick={toggleStandby}
                  title={standby ? "唤醒屏幕" : "息屏休眠"}
                  aria-label={standby ? "唤醒屏幕" : "息屏休眠"}
                  className={`inline-flex items-center justify-center p-1 rounded active:scale-95 transition-all cursor-pointer ${
                    standby
                      ? "text-amber-400 bg-amber-400/12 hover:bg-amber-400/20"
                      : "text-[#8A94A6] hover:text-emerald-300 hover:bg-white/[0.07]"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Chassis Rubber Bumper Feet (Desktop Grounding Detail) */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden sm:flex items-center justify-between w-[88%] max-w-[1680px] h-[3px] px-10"
      >
        <span className="w-16 h-full rounded-b-sm bg-[#0E1118] border-x border-b border-white/10 shadow-md" />
        <span className="w-16 h-full rounded-b-sm bg-[#0E1118] border-x border-b border-white/10 shadow-md" />
      </div>
    </div>
  );
}
