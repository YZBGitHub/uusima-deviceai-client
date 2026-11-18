import {
  Camera,
  FolderPlus,
  Layers,
  Router,
  Trash2,
  Video,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DigitalTwinNodePosition, DigitalTwinProject } from "../types/digitalTwin";
import type { GatewayDeviceItem } from "../types/gateway";

interface DigitalTwinCanvasProps {
  projects: DigitalTwinProject[];
  activeProjectId: string | null;
  highlightProjectSelect: boolean;
  allDevices: GatewayDeviceItem[];
  onSelectProject: (projectId: string | null) => void;
  onOpenNewProjectModal: () => void;
  onUpdateProjectPositions: (
    projectId: string,
    positions: Record<string, DigitalTwinNodePosition>
  ) => void;
  onRemoveDeviceFromProject: (projectId: string, deviceId: string) => void;
  onClearProjectDevices: (projectId: string) => void;
  // Bidirectional sync callbacks -> update GatewayDeviceItem state
  onToggleDeviceOnline: (deviceId: string) => void;
  onToggleDeviceCollecting: (deviceId: string) => void;
  onToggleFan: (deviceId: string) => void;
  onToggleLight: (deviceId: string) => void;
  onBatchSetDevicesState: (deviceIds: string[], online: boolean) => void;
  onToggleRelayChannel: (deviceId: string, channel: string) => void;
  onOpenCameraMonitor: (device: GatewayDeviceItem) => void;
}

function PowerSupplyBox({
  title,
  pos,
  onDragStart,
}: {
  title: string;
  pos: DigitalTwinNodePosition;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onPointerDown={onDragStart}
      style={{ left: pos.x, top: pos.y }}
      className="absolute w-[144px] select-none cursor-grab active:cursor-grabbing group"
    >
      {/* Black header bar */}
      <div className="bg-[#0F172A] text-white text-[11.5px] font-semibold px-2.5 py-1 text-center truncate shadow-xs">
        {title}
      </div>
      {/* Metallic gray body */}
      <div className="bg-[#B8BCC4] border border-[#94A3B8] h-[72px] px-2.5 py-2 flex items-end justify-between relative shadow-sm">
        {/* Yellow 3-pin AC inlet icon */}
        <div className="w-7 h-7 rounded-full bg-[#FACC15] border-2 border-[#CA8A04] flex items-center justify-center shadow-inner">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-[#422006]">
            <rect x="9" y="3.5" width="2" height="4.5" rx="0.5" />
            <rect
              x="4.5"
              y="10.5"
              width="2"
              height="4.5"
              rx="0.5"
              transform="rotate(-28 5.5 12.5)"
            />
            <rect
              x="13.5"
              y="10.5"
              width="2"
              height="4.5"
              rx="0.5"
              transform="rotate(28 14.5 12.5)"
            />
          </svg>
        </div>

        {/* + and - terminals */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#EF4444] border-2 border-[#7F1D1D] text-white text-[13px] font-bold flex items-center justify-center shadow-sm">
              +
            </div>
            <div className="w-2 h-2 rotate-45 bg-[#EF4444] border border-white -mb-3 mt-1" />
          </div>
          <div className="relative flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#1E293B] border-2 border-[#090D16] text-white text-[13px] font-bold flex items-center justify-center shadow-sm">
              −
            </div>
            <div className="w-2 h-2 rotate-45 bg-[#1E293B] border border-white -mb-3 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Rs485ConverterBox({
  pos,
  active,
  onDragStart,
}: {
  pos: DigitalTwinNodePosition;
  active: boolean;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onPointerDown={onDragStart}
      style={{ left: pos.x, top: pos.y }}
      className="absolute flex items-center gap-3 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Green + Black RS485 Terminal Bridge */}
      <div className="relative flex items-center bg-[#18181B] border border-[#3F3F46] rounded-sm px-2 py-1.5 shadow-sm w-[148px] h-[64px]">
        {/* Left green screw terminal */}
        <div className="flex flex-col gap-1 -ml-3 mr-1.5 bg-[#22C55E] border border-[#15803D] p-0.5 rounded-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-xs bg-[#4ADE80] border border-[#166534] flex items-center justify-center"
            >
              <div className="w-1 h-1 rounded-full bg-[#14532D]" />
            </div>
          ))}
        </div>

        {/* Center label */}
        <div className="flex-1 bg-[#E5E7EB] rounded-[2px] px-1.5 py-1 text-[8px] font-mono-tabular leading-tight text-[#111827] flex justify-between">
          <div>
            <div>+12V</div>
            <div>D0</div>
            <div>D1</div>
            <div>GND</div>
          </div>
          <div className="text-right">
            <div>GND</div>
            <div>B</div>
            <div>A</div>
          </div>
        </div>

        {/* Right green screw terminal */}
        <div className="flex flex-col gap-1.5 -mr-3 ml-1.5 bg-[#22C55E] border border-[#15803D] p-0.5 rounded-[2px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-xs bg-[#4ADE80] border border-[#166534] flex items-center justify-center"
            >
              <div className="w-1 h-1 rounded-full bg-[#14532D]" />
            </div>
          ))}
        </div>
      </div>

      {/* Silver UTEK RS485-USB/ETH Adapter */}
      <div className="flex items-center">
        <div className="w-4 h-11 bg-[#166534] border border-[#14532D] rounded-l-xs flex flex-col justify-around items-center py-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#9CA3AF] border border-[#4B5563]"
            />
          ))}
        </div>
        <div className="w-[74px] h-[48px] bg-gradient-to-b from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] border border-[#94A3B8] flex flex-col items-center justify-center px-1 shadow-xs">
          <span className="text-[8px] font-bold text-[#1D4ED8] tracking-wider">
            UTEK
          </span>
          <span className="text-[7px] font-mono-tabular text-[#475569]">
            RS-485 BUS
          </span>
          <span
            className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
              active ? "bg-[#22C55E]" : "bg-[#94A3B8]"
            }`}
          />
        </div>
        <div className="w-2.5 h-7 bg-[#94A3B8] border border-[#64748B] rounded-r-xs" />
      </div>
    </div>
  );
}

function HostPcCloudBox({
  pos,
  anyRunning,
  onlineCount,
  totalCount,
  onToggleAll,
  onDragStart,
}: {
  pos: DigitalTwinNodePosition;
  anyRunning: boolean;
  onlineCount: number;
  totalCount: number;
  onToggleAll: () => void;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onPointerDown={onDragStart}
      style={{ left: pos.x, top: pos.y }}
      className="absolute w-[140px] select-none cursor-grab active:cursor-grabbing flex flex-col items-center"
    >
      {/* Left connection diamonds matching screenshot */}
      <div className="relative w-full flex justify-center">
        <div className="w-[74px] h-[146px] bg-[#18181B] border-2 border-[#3F3F46] rounded-sm p-1.5 flex flex-col justify-between shadow-md relative">
          {/* Top power / IO bay */}
          <div className="bg-[#D4D4D8] rounded-xs p-1 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="w-3 h-1 bg-[#3F3F46]" />
              <div className="w-3 h-1 bg-[#3F3F46]" />
            </div>
            <div className="w-6 h-6 rounded-full border border-[#52525B] bg-[#A1A1AA] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#3F3F46]" />
            </div>
          </div>

          {/* Middle cooling fans */}
          <div className="space-y-1.5 my-1">
            <div className="mx-auto w-9 h-9 rounded-full border-2 border-[#71717A] bg-[#27272A] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-dashed border-[#A1A1AA]" />
            </div>
            <div className="mx-auto w-9 h-9 rounded-full border-2 border-[#71717A] bg-[#27272A] flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border border-dashed border-[#A1A1AA]" />
            </div>
          </div>

          {/* Bottom ports */}
          <div className="bg-[#D4D4D8] rounded-xs px-1.5 py-1 flex items-center justify-between">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-2 bg-[#18181B]" />
              <div className="w-1.5 h-2 bg-[#18181B]" />
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                anyRunning ? "bg-[#22C55E]" : "bg-[#EF4444]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Cloud Status Badge matching screenshot's "设备未开启" blue cloud */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onToggleAll}
        title={anyRunning ? "点击停止所有仿真设备" : "点击一键开启所有仿真设备"}
        className="relative -mt-6 z-10 group cursor-pointer focus:outline-none"
      >
        <div
          className={`px-4 py-2 rounded-full border-2 shadow-md flex flex-col items-center transition-colors ${
            anyRunning
              ? "bg-gradient-to-b from-[#38BDF8] to-[#0284C7] border-[#BAE6FD] text-white"
              : "bg-gradient-to-b from-[#60A5FA] to-[#2563EB] border-[#BFDBFE] text-white"
          }`}
        >
          <span className="text-[11px] font-bold whitespace-nowrap drop-shadow-xs">
            {anyRunning ? `运行中 (${onlineCount}/${totalCount})` : "设备未开启"}
          </span>
          <span className="text-[9px] text-white/90 whitespace-nowrap">
            {anyRunning ? "点击停机" : "点击开启"}
          </span>
        </div>
      </button>
    </div>
  );
}

function SyncedDeviceHardwareNode({
  device,
  pos,
  onDragStart,
  onToggleOnline,
  onToggleCollecting,
  onToggleFan,
  onToggleLight,
  onToggleRelayChannel,
  onOpenCameraMonitor,
  onRemove,
}: {
  device: GatewayDeviceItem;
  pos: DigitalTwinNodePosition;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onToggleOnline: () => void;
  onToggleCollecting: () => void;
  onToggleFan: () => void;
  onToggleLight: () => void;
  onToggleRelayChannel: (channel: string) => void;
  onOpenCameraMonitor: () => void;
  onRemove: () => void;
}) {
  const isOnline = device.status === "online";
  const isActive = isOnline && device.collecting;

  // Sensor / Simulator Hardware Unit (Read-only OLED telemetry, no numeric adjustment)
  if (device.modbusType === "sensor" || device.category === "simulator") {
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[196px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl border-2 border-[#CBD5E1] bg-white shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isActive
                    ? "bg-[#22C55E]"
                    : isOnline
                      ? "bg-[#F59E0B]"
                      : "bg-[#EF4444]"
                }`}
              />
              <span className="text-[11px] font-bold text-[#0F172A] truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Read-only Dark OLED screen inside casing */}
          <div className="m-2 rounded-lg bg-[#0F172A] p-2.5 text-white space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono-tabular text-[#94A3B8]">
              <span>{device.model}</span>
              <span className={isOnline ? "text-[#4ADE80]" : "text-[#F87171]"}>
                {isOnline ? (device.collecting ? "只读采集" : "待机") : "OFF"}
              </span>
            </div>

            {device.sensorMetrics && device.sensorMetrics.length > 0 ? (
              <div className="space-y-1.5">
                {device.sensorMetrics.slice(0, 2).map((m) => (
                  <div
                    key={m.label}
                    className="rounded bg-[#1E293B] px-2.5 py-1.5 flex items-center justify-between text-[10.5px]"
                  >
                    <span className="text-[#94A3B8] truncate max-w-[78px]">
                      {m.key === "temperature"
                        ? "温度"
                        : m.key === "humidity"
                          ? "湿度"
                          : m.key || m.label}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#4ADE80] text-[12px]">
                      {m.value} {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] font-mono-tabular text-[#94A3B8] py-1">
                {device.protocol}
              </div>
            )}
          </div>

          {/* Bottom online badge */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2.5 pb-2 flex items-center justify-between gap-1.5"
          >
            <span className="text-[10px] font-mono-tabular text-[#64748B]">
              {device.protocol}
            </span>
            <button
              type="button"
              onClick={onToggleOnline}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold border cursor-pointer transition-colors ${
                isOnline
                  ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                  : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
              }`}
            >
              <span>{isOnline ? "在线" : "离线"}</span>
            </button>
          </div>
        </div>

        {/* Bottom 4-pin wiring header */}
        <div className="flex justify-center gap-2 -mt-0.5">
          <div className="flex items-center gap-1.5 bg-[#18181B] px-2 py-0.5 rounded-b-sm">
            <span className="w-2 h-2 bg-[#EF4444] rounded-xs" title="+12V" />
            <span className="w-2 h-2 bg-[#0EA5E9] rounded-xs" title="D0" />
            <span className="w-2 h-2 bg-[#22C55E] rounded-xs" title="D1" />
            <span className="w-2 h-2 bg-[#0F172A] border border-[#94A3B8] rounded-xs" title="GND" />
          </div>
        </div>
      </div>
    );
  }

  // Relay Controller Hardware Unit (Black enclosure with green terminals & tactile toggle switches)
  if (device.modbusType === "relay") {
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[228px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-lg border-2 border-[#334155] bg-[#18181B] text-white shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#090D16] border-b border-[#27272A] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline ? "bg-[#22C55E]" : "bg-[#EF4444]"
                }`}
              />
              <span className="text-[11px] font-bold text-white truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#71717A] hover:text-[#EF4444] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="p-2 flex items-stretch gap-1.5">
            {/* Left green Phoenix terminal block */}
            <div className="w-2.5 rounded-xs bg-[#22C55E] border border-[#15803D] flex flex-col justify-around items-center py-1 shrink-0">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#14532D]" />
              ))}
            </div>

            {/* Center DO tactile switches */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 grid grid-cols-2 gap-1.5"
            >
              {(device.relayChannels ?? []).map((ch) => {
                const active = ch.isOn && isOnline;
                return (
                  <button
                    key={ch.channel}
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => onToggleRelayChannel(ch.channel)}
                    title={`点击切换 ${ch.channel} ${ch.label}`}
                    className={`rounded-md px-1.5 py-1.5 text-left border transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                      active
                        ? "bg-[#16A34A]/20 border-[#22C55E] text-[#4ADE80]"
                        : "bg-[#27272A] border-[#3F3F46] text-[#CBD5E1] hover:border-[#71717A]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono-tabular font-bold">
                        {ch.channel}
                      </span>
                      <span
                        className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
                          active ? "bg-[#22C55E]" : "bg-[#52525B]"
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full bg-white shadow-xs transition-transform ${
                            active ? "translate-x-3" : "translate-x-0.5"
                          }`}
                        />
                      </span>
                    </div>
                    <div className="mt-0.5 text-[9.5px] truncate">{ch.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Right green Phoenix terminal block */}
            <div className="w-2.5 rounded-xs bg-[#22C55E] border border-[#15803D] flex flex-col justify-around items-center py-1 shrink-0">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#14532D]" />
              ))}
            </div>
          </div>

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2.5 pb-2 flex items-center justify-between gap-2 text-[10.5px]"
          >
            <span className="font-mono-tabular text-[#94A3B8] truncate">
              {device.model}
            </span>
            <button
              type="button"
              onClick={onToggleOnline}
              className={`rounded px-2 py-0.5 font-semibold cursor-pointer ${
                isOnline
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#DC2626] text-white"
              }`}
            >
              {isOnline ? "在线" : "离线"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fan Actuator Hardware Unit (Spinning 4-blade rotor synced with southbound & live camera monitor)
  if (device.category === "fan") {
    const fanOn = isOnline && Boolean(device.fanRunning ?? device.collecting);
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[206px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl border-2 border-[#475569] bg-[#1E293B] text-white shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#0F172A] border-b border-[#334155] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  fanOn
                    ? "bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
                    : isOnline
                      ? "bg-[#22C55E]"
                      : "bg-[#EF4444]"
                }`}
              />
              <span className="text-[11px] font-bold truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="p-2.5 flex items-center gap-3">
            {/* Circular Shroud + Animated Fan Blades */}
            <div
              className={`w-16 h-16 rounded-full bg-[#090D16] border-2 flex items-center justify-center shrink-0 relative ${
                fanOn
                  ? "border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.35)]"
                  : "border-[#475569]"
              }`}
            >
              <svg
                viewBox="0 0 64 64"
                className={`w-12 h-12 ${fanOn ? "animate-spin" : ""}`}
                style={fanOn ? { animationDuration: "0.75s" } : undefined}
              >
                {[0, 90, 180, 270].map((deg) => (
                  <path
                    key={deg}
                    d="M32 28 Q46 14 54 25 Q46 35 32 34 Z"
                    fill={fanOn ? "#38BDF8" : "#64748B"}
                    transform={`rotate(${deg} 32 32)`}
                  />
                ))}
                <circle
                  cx="32"
                  cy="32"
                  r="6"
                  fill={fanOn ? "#E0F2FE" : "#94A3B8"}
                />
              </svg>
              <div className="pointer-events-none absolute inset-2 rounded-full border border-white/10" />
            </div>

            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 space-y-2"
            >
              <div className="text-[10.5px] font-mono-tabular">
                <div className="text-[#94A3B8] truncate">{device.model}</div>
                <div
                  className={`font-bold ${
                    fanOn ? "text-[#38BDF8]" : "text-[#CBD5E1]"
                  }`}
                >
                  {fanOn ? "● 运转中" : "● 已停止"}
                </div>
              </div>

              {/* Tactile Fan Power Switch Button */}
              <button
                type="button"
                role="switch"
                aria-checked={fanOn}
                onClick={onToggleFan}
                className={`w-full rounded-lg border px-2 py-1 flex items-center justify-between text-[11px] font-semibold cursor-pointer transition-all shadow-xs active:scale-[0.98] ${
                  fanOn
                    ? "border-[#38BDF8] bg-[#0284C7]/25 text-[#E0F2FE]"
                    : "border-[#475569] bg-[#0F172A] text-[#CBD5E1] hover:border-[#64748B]"
                }`}
              >
                <span>{fanOn ? "开启" : "关闭"}</span>
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    fanOn ? "bg-[#38BDF8]" : "bg-[#475569]"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform ${
                      fanOn ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2.5 pb-2 flex items-center justify-between text-[10px]"
          >
            <span className="font-mono-tabular text-[#94A3B8]">
              {device.protocol}
            </span>
            <button
              type="button"
              onClick={onToggleOnline}
              className={`rounded px-2 py-0.5 font-semibold cursor-pointer ${
                isOnline
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#DC2626] text-white"
              }`}
            >
              {isOnline ? "在线" : "离线"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Light Bulb Hardware Unit (Glowing animated bulb synced with southbound & live camera monitor)
  if (device.category === "light") {
    const bulbOn = isOnline && Boolean(device.lightOn ?? device.collecting);
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[206px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl border-2 border-[#475569] bg-[#1E293B] text-white shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#0F172A] border-b border-[#334155] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  bulbOn
                    ? "bg-[#FACC15] shadow-[0_0_8px_#FACC15]"
                    : isOnline
                      ? "bg-[#22C55E]"
                      : "bg-[#EF4444]"
                }`}
              />
              <span className="text-[11px] font-bold truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="p-2.5 flex items-center gap-3">
            {/* Glowing Animated SVG Bulb */}
            <div
              className={`w-16 h-16 rounded-full bg-[#090D16] border-2 flex items-center justify-center shrink-0 relative transition-all duration-300 ${
                bulbOn
                  ? "border-[#FACC15] shadow-[0_0_16px_rgba(250,204,21,0.45)]"
                  : "border-[#475569]"
              }`}
            >
              {bulbOn && (
                <div className="pointer-events-none absolute inset-1 rounded-full bg-[#FDE047]/20 animate-ping" style={{ animationDuration: "2.2s" }} />
              )}
              <svg viewBox="0 0 64 64" className="w-12 h-12 relative z-10">
                {bulbOn && (
                  <g
                    stroke="#FDE047"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  >
                    <line x1="32" y1="5" x2="32" y2="11" />
                    <line x1="14" y1="12" x2="18" y2="16" />
                    <line x1="50" y1="12" x2="46" y2="16" />
                    <line x1="8" y1="28" x2="14" y2="28" />
                    <line x1="56" y1="28" x2="50" y2="28" />
                  </g>
                )}
                <path
                  d="M32 14 C22 14 16 21 16 29 C16 35 20 39 23 43 L24 47 L40 47 L41 43 C44 39 48 35 48 29 C48 21 42 14 32 14 Z"
                  fill={bulbOn ? "#FDE047" : "#334155"}
                  stroke={bulbOn ? "#FEF08A" : "#64748B"}
                  strokeWidth="2"
                />
                <path
                  d="M27 32 L30 25 L32 30 L34 25 L37 32"
                  fill="none"
                  stroke={bulbOn ? "#FFFFFF" : "#94A3B8"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="25"
                  y="47"
                  width="14"
                  height="6"
                  rx="2"
                  fill="#94A3B8"
                />
                <rect
                  x="27"
                  y="53"
                  width="10"
                  height="4"
                  rx="2"
                  fill="#64748B"
                />
              </svg>
            </div>

            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 space-y-2"
            >
              <div className="text-[10.5px] font-mono-tabular">
                <div className="text-[#94A3B8] truncate">{device.model}</div>
                <div
                  className={`font-bold ${
                    bulbOn ? "text-[#FDE047]" : "text-[#CBD5E1]"
                  }`}
                >
                  {bulbOn ? "● 点亮照明" : "● 已熄灭"}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={bulbOn}
                onClick={onToggleLight}
                className={`w-full rounded-lg border px-2 py-1 flex items-center justify-between text-[11px] font-semibold cursor-pointer transition-all shadow-xs active:scale-[0.98] ${
                  bulbOn
                    ? "border-[#FACC15] bg-[#EAB308]/20 text-[#FEF08A]"
                    : "border-[#475569] bg-[#0F172A] text-[#CBD5E1] hover:border-[#64748B]"
                }`}
              >
                <span>{bulbOn ? "开启" : "关闭"}</span>
                <span
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    bulbOn ? "bg-[#EAB308]" : "bg-[#475569]"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform ${
                      bulbOn ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="px-2.5 pb-2 flex items-center justify-between text-[10px]"
          >
            <span className="font-mono-tabular text-[#94A3B8]">
              {device.protocol}
            </span>
            <button
              type="button"
              onClick={onToggleOnline}
              className={`rounded px-2 py-0.5 font-semibold cursor-pointer ${
                isOnline
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#DC2626] text-white"
              }`}
            >
              {isOnline ? "在线" : "离线"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gateway Device Hardware Unit
  if (device.category === "gateway") {
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[212px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl border-2 border-[#3B82F6]/60 bg-[#0F172A] text-white shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Router className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="text-[11px] font-bold truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="p-2.5 space-y-2">
            {/* Industrial Gateway Ports & LEDs */}
            <div className="rounded-lg bg-[#1E293B] border border-[#334155] p-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-[#0F172A] border border-[#475569] text-[9px] font-mono-tabular text-[#38BDF8]">
                  ETH0
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#0F172A] border border-[#475569] text-[9px] font-mono-tabular text-[#4ADE80]">
                  RS485
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? "bg-[#22C55E]" : "bg-[#64748B]"
                  }`}
                />
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-[#38BDF8]" : "bg-[#EF4444]"
                  }`}
                />
              </div>
            </div>

            {/* Tactile Switch for Gateway Forwarding */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={onToggleCollecting}
                className={`flex-1 rounded-lg border px-2 py-1 flex items-center justify-between text-[10.5px] font-semibold cursor-pointer transition-all ${
                  isActive
                    ? "border-[#22C55E] bg-[#16A34A]/20 text-[#4ADE80]"
                    : "border-[#475569] bg-[#1E293B] text-[#CBD5E1]"
                }`}
              >
                <span>{isActive ? "服务运行" : "服务暂停"}</span>
                <span
                  className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
                    isActive ? "bg-[#22C55E]" : "bg-[#475569]"
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-3" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleOnline}
                className={`rounded-lg px-2 py-1 text-[10.5px] font-semibold cursor-pointer ${
                  isOnline
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#DC2626] text-white"
                }`}
              >
                {isOnline ? "在线" : "离线"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Camera Hardware Unit
  if (device.category === "camera") {
    return (
      <div
        onPointerDown={onDragStart}
        style={{ left: pos.x, top: pos.y }}
        className="absolute w-[204px] select-none cursor-grab active:cursor-grabbing"
      >
        <div className="rounded-xl border-2 border-[#94A3B8] bg-[#F8FAFC] shadow-md overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#0F172A] text-white flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Camera className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span className="text-[11px] font-bold truncate">
                {device.name}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              title="从当前仿真画布移除"
              className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <div className="p-2.5 space-y-2">
            {/* Optical lens graphic */}
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full bg-[#1E293B] border-2 border-[#475569] flex items-center justify-center shrink-0 relative">
                <div className="w-6 h-6 rounded-full bg-[#0F172A] border border-[#38BDF8]/60 flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isActive
                        ? "bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
                        : "bg-[#475569]"
                    }`}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1 text-[10.5px] font-mono-tabular">
                <div className="font-semibold text-[#0F172A] truncate">
                  {device.model}
                </div>
                <div className="text-[#64748B]">
                  {device.resolution ?? "1920×1080"} · {device.fps ?? 25}fps
                </div>
                <div
                  className={
                    isActive
                      ? "text-[#16A34A] font-semibold"
                      : isOnline
                        ? "text-[#D97706]"
                        : "text-[#DC2626]"
                  }
                >
                  {isActive ? "● RTSP 推流中" : isOnline ? "● 待机中" : "● 已离线"}
                </div>
              </div>
            </div>

            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={onOpenCameraMonitor}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] px-2 py-1 text-[10.5px] font-semibold text-white cursor-pointer"
              >
                <Video className="w-3 h-3" />
                <span>实时画面</span>
              </button>
              <button
                type="button"
                onClick={onToggleOnline}
                className={`rounded px-2 py-1 text-[10.5px] font-semibold border cursor-pointer ${
                  isOnline
                    ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]"
                    : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                }`}
              >
                {isOnline ? "在线" : "离线"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PLC / Generic Industrial Device Hardware Unit
  return (
    <div
      onPointerDown={onDragStart}
      style={{ left: pos.x, top: pos.y }}
      className="absolute w-[200px] select-none cursor-grab active:cursor-grabbing"
    >
      <div className="rounded-lg border-2 border-[#475569] bg-[#E2E8F0] shadow-md overflow-hidden">
        <div className="px-2.5 py-1.5 bg-[#1E293B] text-white flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline ? "bg-[#22C55E]" : "bg-[#EF4444]"
              }`}
            />
            <span className="text-[11px] font-bold truncate">
              {device.name}
            </span>
          </div>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="p-0.5 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <div className="p-2.5 space-y-2 text-[11px] font-mono-tabular">
          <div className="bg-[#0F172A] text-[#E2E8F0] rounded p-2 space-y-1">
            <div className="flex justify-between text-[10px] text-[#94A3B8]">
              <span>{device.model}</span>
              <span>{device.protocol}</span>
            </div>
            {device.sensorMetrics?.[0] && (
              <div className="flex justify-between text-[#4ADE80] font-bold">
                <span>{device.sensorMetrics[0].key || "VAL"}</span>
                <span>
                  {device.sensorMetrics[0].value} {device.sensorMetrics[0].unit}
                </span>
              </div>
            )}
          </div>

          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5"
          >
            <button
              type="button"
              onClick={onToggleOnline}
              className={`flex-1 rounded py-1 text-[10.5px] font-semibold cursor-pointer ${
                isOnline
                  ? "bg-[#16A34A] text-white"
                  : "bg-[#DC2626] text-white"
              }`}
            >
              {isOnline ? "RUN" : "STOP"}
            </button>
            <button
              type="button"
              onClick={onToggleCollecting}
              className="flex-1 rounded bg-white border border-[#CBD5E1] py-1 text-[10.5px] font-semibold text-[#334155] cursor-pointer"
            >
              {device.collecting ? "采集中" : "暂停"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getDefaultNodePositions(
  deviceIds: string[]
): Record<string, DigitalTwinNodePosition> {
  const positions: Record<string, DigitalTwinNodePosition> = {
    "infra-power-12v": { x: 24, y: 110 },
    "infra-power-220v": { x: 690, y: 36 },
    "infra-rs485": { x: 675, y: 335 },
    "infra-host": { x: 860, y: 115 },
  };

  deviceIds.forEach((id, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    positions[`dev-${id}`] = {
      x: 205 + col * 238,
      y: 55 + row * 195,
    };
  });

  return positions;
}

export function DigitalTwinCanvas({
  projects,
  activeProjectId,
  highlightProjectSelect,
  allDevices,
  onSelectProject,
  onOpenNewProjectModal,
  onUpdateProjectPositions,
  onRemoveDeviceFromProject,
  onClearProjectDevices,
  onToggleDeviceOnline,
  onToggleDeviceCollecting,
  onToggleFan,
  onToggleLight,
  onBatchSetDevicesState,
  onToggleRelayChannel,
  onOpenCameraMonitor,
}: DigitalTwinCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) ?? null;

  const syncedDevices = useMemo(() => {
    if (!activeProject) return [];
    const map = new Map(allDevices.map((d) => [d.id, d]));
    return activeProject.syncedDeviceIds
      .map((id) => map.get(id))
      .filter((d): d is GatewayDeviceItem => Boolean(d));
  }, [activeProject, allDevices]);

  const positions = useMemo(() => {
    if (!activeProject) return {};
    const defaults = getDefaultNodePositions(activeProject.syncedDeviceIds);
    return { ...defaults, ...activeProject.nodePositions };
  }, [activeProject]);

  const handleDragNode = (
    nodeKey: string,
    e: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!activeProject) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const orig = positions[nodeKey] ?? { x: 100, y: 100 };

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      const nextX = Math.max(12, Math.round(orig.x + dx));
      const nextY = Math.max(12, Math.round(orig.y + dy));
      onUpdateProjectPositions(activeProject.id, {
        ...positions,
        [nodeKey]: { x: nextX, y: nextY },
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  const p12 = positions["infra-power-12v"] ?? { x: 24, y: 110 };
  const p220 = positions["infra-power-220v"] ?? { x: 690, y: 36 };
  const pRs = positions["infra-rs485"] ?? { x: 675, y: 335 };
  const pHost = positions["infra-host"] ?? { x: 860, y: 115 };

  const onlineDevicesCount = syncedDevices.filter(
    (d) => d.status === "online"
  ).length;
  const anyDeviceRunning = syncedDevices.some(
    (d) => d.status === "online" && d.collecting
  );
  const hasModbusOrPlc = syncedDevices.some(
    (d) => d.category !== "camera"
  );

  // Build orthogonal circuit wires dynamically based on current node coordinates
  const wirePaths = useMemo(() => {
    if (syncedDevices.length === 0) return [];
    const lines: {
      id: string;
      points: string;
      color: string;
      active: boolean;
      dashed?: boolean;
      startDot: { x: number; y: number };
      endDot: { x: number; y: number };
    }[] = [];

    // 220V power -> Host PC red power wire
    const p220Out = { x: p220.x + 102, y: p220.y + 98 };
    const hostPowerIn = { x: pHost.x + 32, y: pHost.y + 42 };
    const mid220Y = Math.max(p220Out.y + 18, hostPowerIn.y);
    lines.push({
      id: "wire-220v-host",
      points: `${p220Out.x},${p220Out.y} ${p220Out.x},${mid220Y} ${hostPowerIn.x},${mid220Y} ${hostPowerIn.x},${hostPowerIn.y}`,
      color: "#EF4444",
      active: anyDeviceRunning,
      startDot: p220Out,
      endDot: hostPowerIn,
    });

    // RS485 Adapter -> Host PC cyan data wire (when Modbus/PLC synced)
    if (hasModbusOrPlc) {
      const rsOut = { x: pRs.x + 240, y: pRs.y + 32 };
      const hostDataIn = { x: pHost.x + 32, y: pHost.y + 116 };
      const midX = Math.round((rsOut.x + hostDataIn.x) / 2);
      lines.push({
        id: "wire-rs485-host",
        points: `${rsOut.x},${rsOut.y} ${midX},${rsOut.y} ${midX},${hostDataIn.y} ${hostDataIn.x},${hostDataIn.y}`,
        color: "#0EA5E9",
        active: anyDeviceRunning,
        startDot: rsOut,
        endDot: hostDataIn,
      });
    }

    // Connect each synced device to 12V Power Supply (+ Red / - Black) and Data Bus (Cyan)
    const p12Pos = { x: p12.x + 92, y: p12.y + 102 };
    const p12Neg = { x: p12.x + 122, y: p12.y + 102 };

    syncedDevices.forEach((dev, idx) => {
      const dPos = positions[`dev-${dev.id}`] ?? { x: 240, y: 80 };
      const isOnline = dev.status === "online";
      const isCollecting = isOnline && dev.collecting;

      // Red +12V wire to device
      const devPowerIn = { x: dPos.x + 12, y: dPos.y + 70 };
      const busY = p12Pos.y + 22 + idx * 7;
      lines.push({
        id: `wire-pwr-pos-${dev.id}`,
        points: `${p12Pos.x},${p12Pos.y} ${p12Pos.x},${busY} ${devPowerIn.x - 18},${busY} ${devPowerIn.x - 18},${devPowerIn.y} ${devPowerIn.x},${devPowerIn.y}`,
        color: isOnline ? "#EF4444" : "#94A3B8",
        active: isOnline,
        startDot: p12Pos,
        endDot: devPowerIn,
      });

      // Black GND wire to device
      const devGndIn = { x: dPos.x + 12, y: dPos.y + 84 };
      const gndBusY = p12Neg.y + 30 + idx * 7;
      lines.push({
        id: `wire-pwr-neg-${dev.id}`,
        points: `${p12Neg.x},${p12Neg.y} ${p12Neg.x},${gndBusY} ${devGndIn.x - 24},${gndBusY} ${devGndIn.x - 24},${devGndIn.y} ${devGndIn.x},${devGndIn.y}`,
        color: isOnline ? "#1E293B" : "#CBD5E1",
        active: isOnline,
        startDot: p12Neg,
        endDot: devGndIn,
      });

      // Blue data signal wire -> RS485 adapter or direct to Host PC (camera)
      if (dev.category === "camera") {
        const camOut = { x: dPos.x + 202, y: dPos.y + 56 };
        const hostCamIn = { x: pHost.x + 32, y: pHost.y + 94 };
        const midX = Math.round((camOut.x + hostCamIn.x) / 2);
        lines.push({
          id: `wire-data-${dev.id}`,
          points: `${camOut.x},${camOut.y} ${midX},${camOut.y} ${midX},${hostCamIn.y} ${hostCamIn.x},${hostCamIn.y}`,
          color: isOnline ? "#0EA5E9" : "#94A3B8",
          active: isCollecting,
          dashed: !isOnline,
          startDot: camOut,
          endDot: hostCamIn,
        });
      } else {
        const devDataOut = { x: dPos.x + 100, y: dPos.y + 150 };
        const rsIn = { x: pRs.x + 2, y: pRs.y + 22 + (idx % 3) * 10 };
        const midY = Math.max(devDataOut.y + 16, rsIn.y);
        lines.push({
          id: `wire-data-${dev.id}`,
          points: `${devDataOut.x},${devDataOut.y} ${devDataOut.x},${midY} ${rsIn.x - 16},${midY} ${rsIn.x - 16},${rsIn.y} ${rsIn.x},${rsIn.y}`,
          color: isOnline ? "#0EA5E9" : "#94A3B8",
          active: isCollecting,
          dashed: !isOnline,
          startDot: devDataOut,
          endDot: rsIn,
        });
      }
    });

    return lines;
  }, [syncedDevices, positions, p12, p220, pRs, pHost, anyDeviceRunning, hasModbusOrPlc]);

  return (
    <div className="h-full flex flex-col rounded-2xl border border-[#DCE6FC] bg-white overflow-hidden shadow-[0_4px_20px_rgba(68,100,235,0.04)]">
      {/* Top Project Selector & Simulation Controls */}
      <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#F8FAFF] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="dt-project-select"
              className="text-[12.5px] font-semibold text-[#1E293B] whitespace-nowrap"
            >
              仿真项目
            </label>
            <select
              id="dt-project-select"
              value={activeProjectId ?? ""}
              onChange={(e) => onSelectProject(e.target.value || null)}
              className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-medium bg-white focus:outline-none cursor-pointer transition-all min-w-[220px] ${
                highlightProjectSelect
                  ? "border-[#EF4444] ring-2 ring-[#EF4444]/30 text-[#DC2626]"
                  : "border-[#CBD5E1] focus:border-[#3D68F5] text-[#0F172A]"
              }`}
            >
              <option value="">请选择仿真项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.syncedDeviceIds.length})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>新建仿真项目</span>
            </button>
          </div>
        </div>

        {/* Canvas tools when a project is active */}
        {activeProject && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {syncedDevices.length > 0 && (
              <button
                type="button"
                onClick={() => onClearProjectDevices(activeProject.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#FECACA] px-2.5 py-1.5 text-[12px] font-medium text-[#64748B] cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空设备</span>
              </button>
            )}

            <div className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-white overflow-hidden ml-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
                aria-label="缩小画布"
                className="p-1.5 text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11.5px] font-mono-tabular text-[#334155]">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.35, Number((z + 0.1).toFixed(2))))}
                aria-label="放大画布"
                className="p-1.5 text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Graph Paper Engineering Simulation Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-auto"
        style={{
          backgroundColor: "#FAFAFA",
          backgroundImage: `
            linear-gradient(to right, rgba(203, 213, 225, 0.36) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(203, 213, 225, 0.36) 1px, transparent 1px),
            linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px, 18px 18px, 90px 90px, 90px 90px",
        }}
      >
        {!activeProject ? (
          /* No Simulation Project Selected Yet */
          <div className="h-full min-h-[480px] flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-[#DCE6FC] bg-white/95 backdrop-blur-xs p-5 text-center shadow-[0_10px_32px_rgba(37,99,235,0.08)] space-y-3.5">
              <div className="mx-auto w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">
                选择或新建仿真项目
              </h3>

              {projects.length > 0 && (
                <div className="grid grid-cols-1 gap-2 text-left">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectProject(p.id)}
                      className="w-full rounded-xl border border-[#E2E8F0] hover:border-[#3D68F5] hover:bg-[#F4F7FF] px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#64748B]">
                          {p.code}
                        </div>
                      </div>
                      <span className="text-[12px] font-medium text-[#3D68F5] shrink-0 ml-2">
                        打开
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={onOpenNewProjectModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D68F5] hover:bg-[#2E56DE] px-4 py-2 text-[12.5px] font-medium text-white cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>新建仿真项目</span>
                </button>
              </div>
            </div>
          </div>
        ) : syncedDevices.length === 0 ? (
          /* Project Selected, Default Empty Devices State */
          <div className="h-full min-h-[480px] flex items-center justify-center p-6">
            <div className="max-w-sm w-full rounded-2xl border border-dashed border-[#94A3B8] bg-white/90 backdrop-blur-xs p-5 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-[14px] font-bold text-[#0F172A]">
                暂无仿真设备
              </div>
              <p className="text-[12px] text-[#64748B]">
                请在左侧勾选南向设备后点击「同步到仿真」
              </p>
            </div>
          </div>
        ) : (
          /* Active Circuit & Hardware Virtual Simulation Canvas */
          <div
            className="relative min-w-[1040px] min-h-[540px] origin-top-left transition-transform duration-150"
            style={{
              transform: `scale(${zoom})`,
              width: "1060px",
              height: `${Math.max(540, 120 + Math.ceil(syncedDevices.length / 2) * 205)}px`,
            }}
          >
            {/* Dynamic Orthogonal Wiring SVG Layer */}
            <svg
              className="pointer-events-none absolute inset-0 w-full h-full"
              aria-hidden="true"
            >
              {wirePaths.map((wire) => (
                <g key={wire.id}>
                  <polyline
                    points={wire.points}
                    fill="none"
                    stroke={wire.color}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                    strokeDasharray={wire.dashed ? "5 4" : undefined}
                    opacity={0.9}
                  />
                  {/* Animated flow pulse for active connections */}
                  {wire.active && wire.color === "#0EA5E9" && (
                    <polyline
                      points={wire.points}
                      fill="none"
                      stroke="#7DD3FC"
                      strokeWidth={2.5}
                      strokeDasharray="6 14"
                      strokeLinecap="round"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="20"
                        to="0"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </polyline>
                  )}
                  {/* Diamond terminal connectors */}
                  <rect
                    x={wire.startDot.x - 3.5}
                    y={wire.startDot.y - 3.5}
                    width={7}
                    height={7}
                    transform={`rotate(45 ${wire.startDot.x} ${wire.startDot.y})`}
                    fill={wire.color}
                  />
                  <rect
                    x={wire.endDot.x - 3.5}
                    y={wire.endDot.y - 3.5}
                    width={7}
                    height={7}
                    transform={`rotate(45 ${wire.endDot.x} ${wire.endDot.y})`}
                    fill={wire.color}
                  />
                </g>
              ))}
            </svg>

            {/* Infrastructure: 12V Power Supply */}
            <PowerSupplyBox
              title="12V Power Supply"
              pos={p12}
              onDragStart={(e) => handleDragNode("infra-power-12v", e)}
            />

            {/* Infrastructure: 220V 通用电源 */}
            <PowerSupplyBox
              title="220V 通用电源"
              pos={p220}
              onDragStart={(e) => handleDragNode("infra-power-220v", e)}
            />

            {/* Infrastructure: RS485 Bus Converter (shown when Modbus/PLC devices exist) */}
            {hasModbusOrPlc && (
              <Rs485ConverterBox
                pos={pRs}
                active={anyDeviceRunning}
                onDragStart={(e) => handleDragNode("infra-rs485", e)}
              />
            )}

            {/* Infrastructure: Host PC & Cloud Status */}
            <HostPcCloudBox
              pos={pHost}
              anyRunning={anyDeviceRunning}
              onlineCount={onlineDevicesCount}
              totalCount={syncedDevices.length}
              onToggleAll={() =>
                onBatchSetDevicesState(
                  syncedDevices.map((d) => d.id),
                  !anyDeviceRunning
                )
              }
              onDragStart={(e) => handleDragNode("infra-host", e)}
            />

            {/* Synced Southbound Devices as Interactive Virtual Hardware Nodes */}
            {syncedDevices.map((dev) => {
              const nodeKey = `dev-${dev.id}`;
              const pos = positions[nodeKey] ?? { x: 205, y: 55 };
              return (
                <SyncedDeviceHardwareNode
                  key={dev.id}
                  device={dev}
                  pos={pos}
                  onDragStart={(e) => handleDragNode(nodeKey, e)}
                  onToggleOnline={() => onToggleDeviceOnline(dev.id)}
                  onToggleCollecting={() => onToggleDeviceCollecting(dev.id)}
                  onToggleFan={() => onToggleFan(dev.id)}
                  onToggleLight={() => onToggleLight(dev.id)}
                  onToggleRelayChannel={(ch) =>
                    onToggleRelayChannel(dev.id, ch)
                  }
                  onOpenCameraMonitor={() => onOpenCameraMonitor(dev)}
                  onRemove={() =>
                    onRemoveDeviceFromProject(activeProject.id, dev.id)
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Compact Wiring Legend */}
      {activeProject && (
        <div className="px-4 py-2 border-t border-[#E5E7EB] bg-white flex flex-wrap items-center gap-4 text-[11.5px] text-[#64748B] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#EF4444] inline-block" />
            <span>+12V / 220V</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#1E293B] inline-block" />
            <span>GND</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#0EA5E9] inline-block" />
            <span>RS485 / RTSP</span>
          </span>
        </div>
      )}
    </div>
  );
}
