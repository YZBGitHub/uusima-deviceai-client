import { GripHorizontal, Video, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { GatewayDeviceItem } from "../types/gateway";

interface CameraLiveMonitorModalProps {
  open: boolean;
  camera: GatewayDeviceItem | null;
  allDevices: GatewayDeviceItem[];
  onClose: () => void;
}

export function CameraLiveMonitorModal({
  open,
  camera,
  allDevices,
  onClose,
}: CameraLiveMonitorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const [useLocalWebcam, setUseLocalWebcam] = useState(false);
  const [pos, setPos] = useState({ x: 68, y: 96 });

  useEffect(() => {
    if (open) {
      setPos({
        x: Math.min(68, Math.max(12, window.innerWidth - 460)),
        y: 96,
      });
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setUseLocalWebcam(false);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  const relayDevice = allDevices.find((d) => d.modbusType === "relay");
  const relayMainLightOn =
    relayDevice?.status === "online" &&
    Boolean(relayDevice.relayChannels?.find((c) => c.channel === "DO1")?.isOn);
  const alarmOn =
    relayDevice?.status === "online" &&
    Boolean(relayDevice.relayChannels?.find((c) => c.channel === "DO4")?.isOn);

  const lightDevice = allDevices.find((d) => d.category === "light");
  const lightOn = lightDevice
    ? lightDevice.status === "online" &&
      Boolean(lightDevice.lightOn ?? lightDevice.collecting)
    : relayMainLightOn;

  const fanDevice = allDevices.find((d) => d.category === "fan");
  const fanOn = Boolean(
    fanDevice &&
      fanDevice.status === "online" &&
      (fanDevice.fanRunning ?? fanDevice.collecting)
  );

  const sensorDevices = allDevices.filter(
    (d) => d.modbusType === "sensor" && d.status === "online"
  );
  const primaryTemp = sensorDevices[0]?.sensorMetrics?.find(
    (m) => m.label.toLowerCase().includes("temp") || m.unit.includes("℃")
  );
  const primaryHum = sensorDevices[0]?.sensorMetrics?.find(
    (m) => m.label.toLowerCase().includes("hum") || m.unit.includes("%")
  );

  const isOnline = camera?.status === "online";
  const isCollecting = Boolean(camera?.collecting);

  useEffect(() => {
    if (!open || !camera || useLocalWebcam) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const render = () => {
      tick += 1;
      const w = canvas.width;
      const h = canvas.height;

      if (!isOnline) {
        ctx.fillStyle = "#090D16";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.fillStyle = "#EF4444";
        ctx.font = "600 16px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText("NO SIGNAL · 设备已离线", w / 2, h / 2);
        ctx.textAlign = "left";
        animId = requestAnimationFrame(render);
        return;
      }

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (lightOn) {
        grad.addColorStop(0, "#1E293B");
        grad.addColorStop(1, "#334155");
      } else {
        grad.addColorStop(0, "#090E1A");
        grad.addColorStop(1, "#111827");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = lightOn
        ? "rgba(148, 163, 184, 0.16)"
        : "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Lab workbench surface
      ctx.fillStyle = lightOn ? "#334155" : "#1E293B";
      ctx.fillRect(46, h * 0.48, w - 92, h * 0.34);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(46, h * 0.48, w - 92, h * 0.34);

      // Simulated Hanging Industrial Light Bulb Device (Left-Center)
      const bulbX = w * 0.36;
      const bulbY = h * 0.25;
      const glowPulse = 0.85 + 0.15 * Math.sin(tick * 0.12);

      if (lightOn) {
        const cone = ctx.createRadialGradient(
          bulbX,
          bulbY + 12,
          14,
          bulbX,
          bulbY + 75,
          240 * glowPulse
        );
        cone.addColorStop(0, "rgba(253, 224, 71, 0.36)");
        cone.addColorStop(0.45, "rgba(250, 204, 21, 0.16)");
        cone.addColorStop(1, "rgba(250, 204, 21, 0)");
        ctx.fillStyle = cone;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.save();
      // Cord & socket
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bulbX, 0);
      ctx.lineTo(bulbX, bulbY - 26);
      ctx.stroke();

      ctx.fillStyle = "#334155";
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bulbX - 9, bulbY - 26, 18, 12, 3);
      ctx.fill();
      ctx.stroke();

      // Animated light rays when ON
      if (lightOn) {
        ctx.save();
        ctx.translate(bulbX, bulbY + 4);
        ctx.strokeStyle = `rgba(253, 224, 71, ${0.55 + 0.35 * Math.sin(tick * 0.16)})`;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8 + tick * 0.01;
          const r1 = 24;
          const r2 = 31 + 3 * Math.sin(tick * 0.18 + i);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
          ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Bulb glass dome
      ctx.beginPath();
      ctx.arc(bulbX, bulbY + 4, 18, 0, Math.PI * 2);
      if (lightOn) {
        const bulbFill = ctx.createRadialGradient(
          bulbX,
          bulbY + 2,
          2,
          bulbX,
          bulbY + 4,
          18
        );
        bulbFill.addColorStop(0, "#FEF9C3");
        bulbFill.addColorStop(0.55, "#FDE047");
        bulbFill.addColorStop(1, "#EAB308");
        ctx.fillStyle = bulbFill;
        ctx.strokeStyle = "#FEF08A";
      } else {
        ctx.fillStyle = "#1E293B";
        ctx.strokeStyle = "#475569";
      }
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();

      // Filament inside bulb
      ctx.strokeStyle = lightOn ? "#FFFFFF" : "#64748B";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bulbX - 5, bulbY - 4);
      ctx.lineTo(bulbX - 3, bulbY + 6);
      ctx.lineTo(bulbX, bulbY + 2);
      ctx.lineTo(bulbX + 3, bulbY + 6);
      ctx.lineTo(bulbX + 5, bulbY - 4);
      ctx.stroke();

      // Bulb tag
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(bulbX - 32, bulbY + 28, 64, 16);
      ctx.fillStyle = lightOn ? "#FDE047" : "#94A3B8";
      ctx.font = "600 9px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(lightOn ? "BULB: ON" : "BULB: OFF", bulbX, bulbY + 39);
      ctx.textAlign = "left";
      ctx.restore();

      // Simulated Industrial Exhaust Fan Unit mounted on right side of scene
      const fanCx = w - 118;
      const fanCy = h * 0.31;
      ctx.save();
      // Fan metallic housing
      ctx.fillStyle = "#1E293B";
      ctx.strokeStyle = fanOn ? "#38BDF8" : "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fanCx - 44, fanCy - 44, 88, 96, 10);
      ctx.fill();
      ctx.stroke();

      // Corner mounting bolts
      const boltOffsets = [
        [-36, -36],
        [36, -36],
        [-36, 36],
        [36, 36],
      ];
      boltOffsets.forEach(([bx, by]) => {
        ctx.fillStyle = "#64748B";
        ctx.beginPath();
        ctx.arc(fanCx + bx, fanCy + by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Circular fan shroud
      ctx.fillStyle = "#090D16";
      ctx.beginPath();
      ctx.arc(fanCx, fanCy, 31, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fanOn ? "#0EA5E9" : "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rotating fan blades
      ctx.save();
      ctx.translate(fanCx, fanCy);
      ctx.rotate(fanOn ? tick * 0.28 : 0.35);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = fanOn ? "#38BDF8" : "#64748B";
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(15, -16, 25, -5);
        ctx.quadraticCurveTo(16, 5, 0, 4);
        ctx.closePath();
        ctx.fill();
      }
      // Center hub
      ctx.fillStyle = fanOn ? "#E0F2FE" : "#94A3B8";
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Protective concentric grille ring
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(fanCx, fanCy, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Status LED & label at bottom of fan housing
      ctx.fillStyle = fanOn ? "#22C55E" : "#EF4444";
      ctx.beginPath();
      ctx.arc(fanCx - 24, fanCy + 42, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fanOn ? "#7DD3FC" : "#94A3B8";
      ctx.font = "600 9.5px JetBrains Mono, monospace";
      ctx.fillText(fanOn ? "FAN: ON" : "FAN: OFF", fanCx - 16, fanCy + 45);
      ctx.restore();

      // Animated airflow streaks when fan is running
      if (fanOn) {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1.6;
        for (let i = 0; i < 3; i++) {
          const offset = (tick * 2.4 + i * 26) % 72;
          const lineY = fanCy - 16 + i * 16;
          const startX = fanCx - 52 - offset;
          ctx.globalAlpha = Math.max(0.1, 1 - offset / 72);
          ctx.beginPath();
          ctx.moveTo(startX, lineY);
          ctx.lineTo(startX - 24, lineY);
          ctx.stroke();
        }
        ctx.restore();
      }

      const highTemp = primaryTemp && primaryTemp.value > 32;
      if (alarmOn || highTemp) {
        const pulse = Math.sin(tick * 0.25) > 0;
        if (pulse) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.14)";
          ctx.fillRect(0, 0, w, h);
        }
        ctx.fillStyle = pulse ? "#EF4444" : "#991B1B";
        ctx.beginPath();
        ctx.arc(76, h * 0.3, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      const speed = isCollecting ? 1.1 : 0;
      const itemX = 76 + ((tick * speed) % (w - 230));
      const itemY = h * 0.56;
      ctx.fillStyle = "#0F766E";
      ctx.fillRect(itemX, itemY, 84, 48);
      ctx.strokeStyle = "#2DD4BF";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(itemX, itemY, 84, 48);

      ctx.strokeStyle = "#22C55E";
      ctx.lineWidth = 2;
      ctx.strokeRect(itemX - 5, itemY - 5, 94, 58);

      // Compact OSD timestamp + live indicator
      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(10, 10, 265, 22);
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "500 10.5px JetBrains Mono, monospace";
      const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      ctx.fillText(
        `${camera.model} · ${camera.resolution ?? "1080P"} · ${nowStr}`,
        16,
        25
      );

      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(10, h - 32, 325, 22);
      ctx.fillStyle = "#38BDF8";
      ctx.font = "500 10.5px JetBrains Mono, monospace";
      ctx.fillText(
        `${primaryTemp ? `${primaryTemp.value}${primaryTemp.unit}` : "--"} | ${primaryHum ? `${primaryHum.value}${primaryHum.unit}` : "--"} | LIGHT:${lightOn ? "ON" : "OFF"} | FAN:${fanOn ? "RUN" : "STOP"}`,
        16,
        h - 17
      );

      ctx.fillStyle = isCollecting ? "#EF4444" : "#F59E0B";
      ctx.beginPath();
      ctx.arc(w - 58, 21, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 10.5px JetBrains Mono, monospace";
      ctx.fillText(isCollecting ? "LIVE" : "PAUSE", w - 49, 25);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    open,
    camera,
    useLocalWebcam,
    isOnline,
    isCollecting,
    lightOn,
    fanOn,
    alarmOn,
    primaryTemp,
    primaryHum,
  ]);

  if (!open || !camera) return null;

  const handleDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = pos.x;
    const origY = pos.y;
    const rect = windowRef.current?.getBoundingClientRect();
    const winW = rect?.width ?? 460;
    const winH = rect?.height ?? 310;

    const handleMove = (moveEvent: PointerEvent) => {
      const nextX = Math.min(
        Math.max(8, origX + moveEvent.clientX - startX),
        Math.max(8, window.innerWidth - winW - 8)
      );
      const nextY = Math.min(
        Math.max(8, origY + moveEvent.clientY - startY),
        Math.max(8, window.innerHeight - winH - 8)
      );
      setPos({ x: nextX, y: nextY });
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

  const toggleLocalWebcam = async () => {
    if (useLocalWebcam) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setUseLocalWebcam(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseLocalWebcam(true);
    } catch {
      // keep RTSP stream if physical webcam unavailable
    }
  };

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label={`监控画面 - ${camera.name}`}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-[440px] max-w-[calc(100vw-24px)] rounded-xl border border-[#334155] bg-[#0F172A] shadow-[0_20px_50px_rgba(15,23,42,0.45)] overflow-hidden select-none"
    >
      {/* Slim Draggable Header Bar */}
      <div
        onPointerDown={handleDragStart}
        className="px-3 py-2 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="text-[12.5px] font-semibold text-white truncate">
            {camera.name}
          </span>
        </div>

        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center gap-1 shrink-0"
        >
          <button
            type="button"
            onClick={toggleLocalWebcam}
            title={useLocalWebcam ? "切回RTSP画面" : "切换本地摄像头"}
            className={`p-1 rounded text-[#CBD5E1] hover:bg-[#334155] hover:text-white cursor-pointer ${
              useLocalWebcam ? "text-[#38BDF8]" : ""
            }`}
          >
            <Video className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭监控画面"
            className="p-1 rounded text-[#CBD5E1] hover:bg-[#EF4444]/20 hover:text-[#FCA5A5] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pure Video Feed Frame */}
      <div className="bg-black aspect-video w-full">
        {useLocalWebcam ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-contain block"
          />
        )}
      </div>
    </div>
  );
}
