import { ArrowRight, Cpu } from "lucide-react";
import { useState } from "react";
import type { DeviceAgent } from "../data/devices";

interface DeviceCardProps {
  device: DeviceAgent;
  onLaunch: (device: DeviceAgent) => void;
}

function AiChipWatermark() {
  return (
    <svg
      viewBox="0 0 84 64"
      fill="none"
      className="pointer-events-none absolute top-0.5 right-1 w-[74px] h-[56px] opacity-55"
      aria-hidden="true"
    >
      {/* Subtle isometric PCB traces */}
      <path
        d="M8 22 L28 10 M14 34 L34 22 M54 14 L74 4 M58 28 L80 16 M46 42 L68 54 M26 44 L12 54"
        stroke="#C7D7F9"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="8" cy="22" r="1.5" fill="#B8CCF8" />
      <circle cx="74" cy="4" r="1.5" fill="#B8CCF8" />
      <circle cx="68" cy="54" r="1.5" fill="#B8CCF8" />
      <circle cx="12" cy="54" r="1.5" fill="#B8CCF8" />

      {/* Isometric AI chip */}
      <g transform="translate(24, 12) rotate(-18 20 18)">
        <rect
          x="4"
          y="4"
          width="32"
          height="26"
          rx="5"
          fill="#EBF1FE"
          stroke="#C2D4FA"
          strokeWidth="1.2"
        />
        <rect
          x="9"
          y="8.5"
          width="22"
          height="17"
          rx="3"
          fill="#F5F8FF"
          stroke="#D4E2FC"
          strokeWidth="0.9"
        />
        <text
          x="20"
          y="20.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#AFC5F6"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="0.5"
        >
          AI
        </text>
      </g>
    </svg>
  );
}

export function DeviceCard({ device, onLaunch }: DeviceCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="group relative flex flex-col justify-between rounded-[15px] border border-[#E2EAFE] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(61,104,245,0.12)]"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F4F7FF 52%, #DBE6FF 100%)",
        boxShadow: "0 5px 18px rgba(68, 100, 235, 0.06)",
      }}
    >
      {/* Top-right AI chip watermark */}
      <AiChipWatermark />

      {/* Header text */}
      <div className="relative z-10 pr-4">
        <div className="mb-1.5 flex items-center">
          <span
            title={
              device.publisherType === "system"
                ? "系统发布智能体"
                : "用户发布智能体"
            }
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-none tracking-wide ${
              device.publisherType === "system"
                ? "bg-[#EBF1FF] text-[#3B66F5] border border-[#D3E0FD]"
                : "bg-[#ECFDF5] text-[#059669] border border-[#BCEFD7]"
            }`}
          >
            {device.publisherType === "system" ? "系统" : "用户"}
          </span>
        </div>
        <h2
          title={device.title}
          className="text-[14px] 2xl:text-[15px] font-semibold text-[#1E293B] leading-snug line-clamp-2 min-h-[2.45rem] 2xl:min-h-0 2xl:line-clamp-1"
        >
          {device.title}
        </h2>
        <p
          title={device.subtitle}
          className="mt-1 text-[11.5px] text-[#64748B] leading-tight line-clamp-1"
        >
          {device.subtitle}
        </p>
      </div>

      {/* Blue gradient hardware stage */}
      <div
        onClick={() => onLaunch(device)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onLaunch(device);
          }
        }}
        aria-label={`查看并开启${device.title}`}
        className="relative z-10 mt-3.5 h-[118px] 2xl:h-[126px] rounded-[11px] flex items-center justify-center p-2.5 overflow-hidden cursor-pointer"
        style={{
          background:
            "linear-gradient(180deg, #ABC9FA 0%, #8CB5F6 46%, #5B8BE5 100%)",
        }}
      >
        {imgError ? (
          <div className="flex flex-col items-center justify-center gap-1.5 text-white/90">
            <Cpu className="w-8 h-8" strokeWidth={1.6} />
            <span className="text-[11px] font-medium px-2 text-center line-clamp-1">
              {device.model}
            </span>
          </div>
        ) : device.imageFrameStyle === "workbench" ? (
          <div className="w-[62%] h-[88%] rounded-[5px] overflow-hidden bg-white shadow-[0_4px_12px_rgba(15,23,42,0.16)] transition-transform duration-200 group-hover:scale-[1.03]">
            <img
              src={device.image}
              alt={device.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-[80%] aspect-square rounded-[6px] overflow-hidden bg-white shadow-[0_4px_12px_rgba(15,23,42,0.14)] flex items-center justify-center p-1 transition-transform duration-200 group-hover:scale-[1.04]">
            <img
              src={device.image}
              alt={device.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Bottom CTA button */}
      <div className="relative z-10 mt-3.5 flex justify-center">
        <button
          type="button"
          onClick={() => onLaunch(device)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#3D68F5] hover:bg-[#2E56DE] active:scale-[0.98] text-white text-[12.5px] font-medium px-5 py-1.5 shadow-[0_4px_12px_rgba(61,104,245,0.3)] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D68F5]"
        >
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.1} />
          <span>开启智能体</span>
        </button>
      </div>
    </article>
  );
}
