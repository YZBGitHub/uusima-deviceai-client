import { Camera, Cloud, Cpu, Eye, Network, Router, Sliders } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GatewayDeviceItem } from "../../types/gateway";

interface GatewayVisualizationProps {
  devices: GatewayDeviceItem[];
}

function LiveVisionCard({ device }: { device: GatewayDeviceItem }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiBox, setAiBox] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let t = 0;
    const draw = () => {
      t += 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#0F172A";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(148,163,184,0.12)";
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const bx = 40 + ((t * 1.1) % (w - 130));
      const by = h * 0.44;
      ctx.fillStyle = "#0F766E";
      ctx.fillRect(bx, by, 68, 42);
      ctx.strokeStyle = "#2DD4BF";
      ctx.strokeRect(bx, by, 68, 42);

      if (aiBox) {
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx - 4, by - 4, 76, 50);
        ctx.fillStyle = "#22C55E";
        ctx.fillRect(bx - 4, by - 18, 92, 15);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 9.5px JetBrains Mono, monospace";
        ctx.fillText("PCB_OK 0.97", bx, by - 7);
      }

      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.fillRect(8, 8, 220, 20);
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "500 10px JetBrains Mono, monospace";
      ctx.fillText(`${device.deviceId} · ${device.resolution ?? "1080P"}`, 14, 21);

      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [aiBox, device.deviceId, device.resolution]);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="bg-black aspect-video">
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#111827] truncate">
            {device.name}
          </div>
          <div className="text-[11.5px] font-mono-tabular text-[#6B7280] truncate">
            {device.rtspUrl}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAiBox((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11.5px] font-medium cursor-pointer shrink-0 ${
            aiBox
              ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
              : "border-[#E5E7EB] bg-white text-[#4B5563]"
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>AI框 {aiBox ? "开" : "关"}</span>
        </button>
      </div>
    </div>
  );
}

export function GatewayVisualization({ devices }: GatewayVisualizationProps) {
  const [tab, setTab] = useState<"topology" | "video">("topology");
  const [selectedNode, setSelectedNode] = useState<GatewayDeviceItem | null>(
    devices[0] ?? null
  );

  const cameras = devices.filter((d) => d.category === "camera");

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#16A34A]" />
          <h2 className="text-[15px] font-bold text-[#111827]">
            边缘组态与可视化中心
          </h2>
        </div>

        <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-[12px] overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setTab("topology")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium cursor-pointer whitespace-nowrap ${
              tab === "topology"
                ? "bg-[#16A34A] text-white"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>设备链路拓扑图</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium cursor-pointer whitespace-nowrap ${
              tab === "video"
                ? "bg-[#16A34A] text-white"
                : "text-[#4B5563] hover:text-[#111827]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>视频监控与 AI 视觉墙 ({cameras.length})</span>
          </button>
        </div>
      </div>

      {tab === "topology" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 rounded-xl border border-[#E5E7EB] bg-white p-3.5 sm:p-5">
            <div className="text-[13px] font-semibold text-[#111827] mb-4">
              云-边-端实时通信拓扑（点击南向设备节点查看实时遥测）
            </div>

            {/* Architecture Topology Canvas */}
            <div className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-3 sm:p-5 space-y-5 sm:space-y-6">
              {/* Northbound Clouds */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {["新大陆教育行业云", "ThingsBoard 实训节点"].map((cloud) => (
                  <div
                    key={cloud}
                    className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2.5 flex items-center gap-2.5 text-[12.5px] font-semibold text-[#1E40AF]"
                  >
                    <Cloud className="w-4 h-4 shrink-0" />
                    <span>{cloud}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="h-6 w-px bg-[#CBD5E1]" />
              </div>

              {/* Edge Gateway Center Node */}
              <div className="mx-auto max-w-sm rounded-xl border-2 border-[#16A34A] bg-[#ECFDF5] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                    <Router className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold text-[#065F46]">
                      AI 边缘网关主机
                    </div>
                    <div className="text-[11.5px] font-mono-tabular text-[#047857] break-words">
                      192.168.1.1 · v1.0.0 · 3 AI 引擎运行中
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="h-6 w-px bg-[#CBD5E1]" />
              </div>

              {/* Southbound Devices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {devices.map((dev) => {
                  const active = selectedNode?.id === dev.id;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => setSelectedNode(dev)}
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        active
                          ? "border-[#16A34A] bg-[#ECFDF5]/60"
                          : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#111827] truncate">
                          <Cpu className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                          <span className="truncate">{dev.name}</span>
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            dev.status === "online"
                              ? "bg-[#16A34A]"
                              : "bg-[#EF4444]"
                          }`}
                        />
                      </div>
                      <div className="mt-1 text-[11px] font-mono-tabular text-[#6B7280] truncate">
                        {dev.protocol} · {dev.deviceId}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="lg:col-span-4 rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
            <h3 className="text-[13.5px] font-bold text-[#111827]">
              节点实时属性面板
            </h3>
            {selectedNode ? (
              <div className="space-y-2.5 text-[12.5px]">
                <div className="rounded-lg bg-[#F9FAFB] p-3 space-y-1">
                  <div className="font-semibold text-[#111827]">
                    {selectedNode.name}
                  </div>
                  <div className="font-mono-tabular text-[11.5px] text-[#6B7280]">
                    ID: {selectedNode.deviceId} · {selectedNode.model}
                  </div>
                  <div className="font-mono-tabular text-[11.5px] text-[#6B7280]">
                    {selectedNode.address}
                  </div>
                </div>

                {selectedNode.sensorMetrics && (
                  <div className="space-y-1.5">
                    <div className="text-[12px] font-medium text-[#4B5563]">
                      实时测点数值
                    </div>
                    {selectedNode.sensorMetrics.map((m) => (
                      <div
                        key={m.label}
                        className="flex items-center justify-between rounded-lg border border-[#F3F4F6] px-3 py-2 font-mono-tabular"
                      >
                        <span className="text-[#4B5563]">{m.label}</span>
                        <span className="font-bold text-[#111827]">
                          {m.value} {m.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedNode.relayChannels && (
                  <div className="space-y-1.5">
                    <div className="text-[12px] font-medium text-[#4B5563]">
                      DO 继电器输出状态
                    </div>
                    {selectedNode.relayChannels.map((ch) => (
                      <div
                        key={ch.channel}
                        className="flex items-center justify-between rounded-lg border border-[#F3F4F6] px-3 py-2"
                      >
                        <span>
                          {ch.channel} · {ch.label}
                        </span>
                        <span
                          className={`font-mono-tabular font-semibold ${
                            ch.isOn ? "text-[#16A34A]" : "text-[#6B7280]"
                          }`}
                        >
                          {ch.isOn ? "ON" : "OFF"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12.5px] text-[#6B7280]">
                请在左侧拓扑中选择设备节点。
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Multi-Camera AI Vision Wall */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map((cam) => (
            <LiveVisionCard key={cam.id} device={cam} />
          ))}
        </div>
      )}
    </div>
  );
}
