import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  LayoutGrid,
  Sparkles,
  Wifi,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SUPPORTED_PROTOCOLS } from "../../data/gatewayInitialData";
import type {
  GatewayAiEngineItem,
  GatewayAlertItem,
  GatewayDeviceItem,
  GatewayLinkageRule,
  GatewaySectionId,
} from "../../types/gateway";

interface GatewayDashboardProps {
  devices: GatewayDeviceItem[];
  rules: GatewayLinkageRule[];
  alerts: GatewayAlertItem[];
  aiEngines: GatewayAiEngineItem[];
  onNavigate: (section: GatewaySectionId, protocolFilter?: string) => void;
}

interface ResourcePoint {
  time: string;
  cpu: number;
  mem: number;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function CircularGauge({
  value,
  label,
  color = "#2563EB",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[96px] h-[96px]">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="7"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[15px] font-bold text-[#1E293B] font-mono-tabular">
            {clamped.toFixed(1)}
          </span>
        </div>
      </div>
      <span className="mt-1.5 text-[11.5px] font-medium text-[#64748B]">
        {label}
      </span>
    </div>
  );
}

export function GatewayDashboard({
  devices,
  rules,
  alerts,
  aiEngines,
  onNavigate,
}: GatewayDashboardProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [uptimeSeconds, setUptimeSeconds] = useState(2 * 3600 + 4 * 60 + 18);
  const [cpuUsage, setCpuUsage] = useState(42.7);
  const [memUsage, setMemUsage] = useState(80.8);
  const [diskUsage, setDiskUsage] = useState(6.3);
  const [dataPointsToday, setDataPointsToday] = useState(1428);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [snapshotToast, setSnapshotToast] = useState<string | null>(null);

  const [resourceSeries, setResourceSeries] = useState<ResourcePoint[]>([
    { time: "13:40:45", cpu: 41.2, mem: 79.4 },
    { time: "13:40:55", cpu: 43.8, mem: 80.1 },
    { time: "13:41:05", cpu: 42.1, mem: 80.5 },
    { time: "13:41:15", cpu: 44.0, mem: 80.9 },
    { time: "13:41:25", cpu: 42.7, mem: 80.8 },
    { time: "13:41:30", cpu: 42.7, mem: 80.8 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      const nextCpu = Number(
        Math.max(18, Math.min(78, cpuUsage + (Math.random() - 0.48) * 3.4)).toFixed(1)
      );
      const nextMem = Number(
        Math.max(62, Math.min(91, memUsage + (Math.random() - 0.5) * 1.2)).toFixed(1)
      );
      const nextDisk = Number(
        Math.max(5.8, Math.min(12.0, diskUsage + (Math.random() - 0.5) * 0.1)).toFixed(1)
      );
      const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false });

      setCpuUsage(nextCpu);
      setMemUsage(nextMem);
      setDiskUsage(nextDisk);
      setDataPointsToday((p) => p + devices.filter((d) => d.collecting).length);
      setResourceSeries((prev) => [
        ...prev.slice(-11),
        { time: nowStr, cpu: nextCpu, mem: nextMem },
      ]);
    }, 3500);

    return () => clearInterval(timer);
  }, [autoRefresh, cpuUsage, memUsage, diskUsage, devices]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.length - onlineCount;
  const collectingCount = devices.filter((d) => d.collecting).length;
  const runningEnginesCount = aiEngines.filter((e) => e.status === "running").length;
  const enabledRulesCount = rules.filter((r) => r.enabled).length;
  const activeAlertsCount = alerts.filter(
    (a) => !a.acknowledged && a.severity !== "info"
  ).length;

  const memGbUsed = useMemo(() => ((memUsage / 100) * 16).toFixed(1), [memUsage]);

  const handleExportSnapshot = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      firmwareVersion: "v1.0.0",
      uptime: formatDuration(uptimeSeconds),
      metrics: { cpuUsage, memUsage, diskUsage, dataPointsToday },
      summary: {
        totalDevices: devices.length,
        onlineCount,
        offlineCount,
        collectingCount,
        runningAiEngines: runningEnginesCount,
        totalRules: rules.length,
        enabledRules: enabledRulesCount,
        activeAlerts: activeAlertsCount,
      },
      devices: devices.map((d) => ({
        deviceId: d.deviceId,
        name: d.name,
        protocol: d.protocol,
        status: d.status,
        collecting: d.collecting,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `edge-gateway-snapshot-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setSnapshotToast("已导出当前边缘网关运行状态快照 JSON");
    setTimeout(() => setSnapshotToast(null), 3000);
  };

  // Chart geometry for Resource Usage Trend
  const chartW = 420;
  const chartH = 190;
  const padL = 36;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const cpuPoints = resourceSeries.map((pt, i) => {
    const x =
      resourceSeries.length <= 1
        ? padL
        : padL + (i / (resourceSeries.length - 1)) * plotW;
    const y = padT + (1 - pt.cpu / 100) * plotH;
    return { x, y, pt };
  });
  const memPoints = resourceSeries.map((pt, i) => {
    const x =
      resourceSeries.length <= 1
        ? padL
        : padL + (i / (resourceSeries.length - 1)) * plotW;
    const y = padT + (1 - pt.mem / 100) * plotH;
    return { x, y, pt };
  });

  const cpuPath = cpuPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const memPath = memPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const cpuArea =
    cpuPoints.length > 0
      ? `${cpuPath} L${cpuPoints[cpuPoints.length - 1].x},${padT + plotH} L${cpuPoints[0].x},${padT + plotH} Z`
      : "";
  const memArea =
    memPoints.length > 0
      ? `${memPath} L${memPoints[memPoints.length - 1].x},${padT + plotH} L${memPoints[0].x},${padT + plotH} Z`
      : "";

  // Donut chart math for Device Status Distribution
  const donutRadius = 38;
  const donutCirc = 2 * Math.PI * donutRadius;
  const onlineRatio = devices.length > 0 ? onlineCount / devices.length : 1;
  const onlineDash = onlineRatio * donutCirc;

  return (
    <div className="space-y-4 pb-16">
      {/* Top Status & Control Strip matching Screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-4 h-4 text-[#059669]" />
          <span className="text-[15px] font-bold text-[#111827]">仪表盘</span>
          <span className="text-[#D1D5DB]" aria-hidden="true">
            |
          </span>
          <span className="text-[12.5px] text-[#6B7280]">设备状态概览</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-[#6B7280] font-mono-tabular">
            运行时长{" "}
            <strong className="font-semibold text-[#111827]">
              {formatDuration(uptimeSeconds)}
            </strong>
          </span>

          <span className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11.5px] font-mono-tabular font-medium text-[#059669]">
            v1.0.0
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-[11.5px] font-medium text-[#059669]">
            <Wifi className="w-3 h-3" />
            <span>已连接</span>
          </span>

          <button
            type="button"
            onClick={handleExportSnapshot}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] px-3 py-1 text-[12px] font-medium text-[#374151] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>导出快照</span>
          </button>

          <label className="inline-flex items-center gap-2 text-[12px] text-[#4B5563] cursor-pointer select-none">
            <span>自动刷新</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRefresh}
              onClick={() => setAutoRefresh((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                autoRefresh ? "bg-[#10B981]" : "bg-[#D1D5DB]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                  autoRefresh ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {snapshotToast && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46]">
          {snapshotToast}
        </div>
      )}

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: 设备总数 */}
        <button
          type="button"
          onClick={() => onNavigate("gw-devices")}
          className="text-left rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-[#6B7280]">设备总数</div>
              <div className="text-[22px] font-bold text-[#111827] leading-tight font-mono-tabular">
                {devices.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] font-mono-tabular whitespace-nowrap">
            <span className="inline-flex items-center gap-1 text-[#059669]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              {onlineCount} 在线
            </span>
            <span className="inline-flex items-center gap-1 text-[#6B7280]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
              {offlineCount} 离线
            </span>
          </div>
        </button>

        {/* Card 2: 活跃告警 */}
        <button
          type="button"
          onClick={() => onNavigate("gw-ops-monitor")}
          className="text-left rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeAlertsCount > 0
                  ? "bg-[#FEF2F2] text-[#EF4444]"
                  : "bg-[#ECFDF5] text-[#10B981]"
              }`}
            >
              {activeAlertsCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">活跃告警</div>
              <div className="text-[22px] font-bold text-[#111827] leading-tight font-mono-tabular">
                {activeAlertsCount}
              </div>
            </div>
          </div>
          <span
            className={`text-[12px] font-medium whitespace-nowrap ${
              activeAlertsCount > 0 ? "text-[#EF4444]" : "text-[#10B981]"
            }`}
          >
            {activeAlertsCount > 0 ? "待处理" : "系统正常"}
          </span>
        </button>

        {/* Card 3: 数据采集引擎 */}
        <button
          type="button"
          onClick={() => onNavigate("gw-data")}
          className="text-left rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">数据采集引擎</div>
              <div className="text-[22px] font-bold text-[#111827] leading-tight font-mono-tabular">
                {collectingCount}
              </div>
              <div className="text-[11px] text-[#9CA3AF] font-mono-tabular">
                今日数据点: {dataPointsToday}
              </div>
            </div>
          </div>
          <span className="text-[12px] text-[#6B7280] font-mono-tabular">
            {(collectingCount * 0.4).toFixed(1)}%
          </span>
        </button>

        {/* Card 4: AI 推理引擎 */}
        <button
          type="button"
          onClick={() => onNavigate("gw-ai-center")}
          className="text-left rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">AI 推理引擎</div>
              <div className="text-[22px] font-bold text-[#111827] leading-tight font-mono-tabular">
                {runningEnginesCount}
              </div>
            </div>
          </div>
          <span className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11.5px] font-medium text-[#059669] whitespace-nowrap">
            运行中
          </span>
        </button>

        {/* Card 5: 规则总数 */}
        <button
          type="button"
          onClick={() => onNavigate("gw-comm-linkage")}
          className="text-left rounded-xl border border-[#E5E7EB] bg-white hover:border-[#CBD5E1] px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[12px] text-[#6B7280]">规则总数</div>
              <div className="text-[22px] font-bold text-[#111827] leading-tight font-mono-tabular">
                {rules.length}
              </div>
            </div>
          </div>
          <span className="text-[12px] text-[#6B7280] font-mono-tabular whitespace-nowrap">
            已启用 {enabledRulesCount} 条
          </span>
        </button>
      </div>

      {/* Middle 3-column Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. 资源使用趋势 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-[13.5px] font-semibold text-[#111827]">
              资源使用趋势
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular">
              <span className="rounded-md bg-[#EEF2FF] px-2 py-0.5 font-semibold text-[#4F46E5]">
                CPU {cpuUsage.toFixed(1)}%
              </span>
              <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 font-semibold text-[#059669]">
                MEM {memUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="relative">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-[200px] overflow-visible"
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Horizontal Gridlines */}
              {[0, 20, 40, 60, 80, 100].map((val) => {
                const y = padT + (1 - val / 100) * plotH;
                return (
                  <g key={val}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3.5}
                      textAnchor="end"
                      className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
                    >
                      {val}%
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={memArea} fill="rgba(16, 185, 129, 0.12)" />
              <path d={cpuArea} fill="rgba(99, 102, 241, 0.14)" />

              {/* Lines */}
              <path
                d={memPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d={cpuPath}
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              {/* Interactive Hover Targets */}
              {cpuPoints.map((p, idx) => (
                <g key={idx}>
                  <rect
                    x={p.x - 14}
                    y={padT}
                    width={28}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIdx(idx)}
                  />
                  {hoverIdx === idx && (
                    <>
                      <line
                        x1={p.x}
                        y1={padT}
                        x2={p.x}
                        y2={padT + plotH}
                        stroke="#CBD5E1"
                        strokeDasharray="3 3"
                      />
                      <circle cx={p.x} cy={p.y} r="3.5" fill="#6366F1" />
                      <circle
                        cx={memPoints[idx].x}
                        cy={memPoints[idx].y}
                        r="3.5"
                        fill="#10B981"
                      />
                    </>
                  )}
                </g>
              ))}

              {/* X Axis Time Labels */}
              {resourceSeries.length > 0 && (
                <>
                  <text
                    x={padL}
                    y={chartH - 6}
                    textAnchor="start"
                    className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
                  >
                    {resourceSeries[0].time}
                  </text>
                  <text
                    x={chartW - padR}
                    y={chartH - 6}
                    textAnchor="end"
                    className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
                  >
                    {resourceSeries[resourceSeries.length - 1].time}
                  </text>
                </>
              )}
            </svg>

            {hoverIdx !== null && resourceSeries[hoverIdx] && (
              <div className="absolute top-2 left-12 rounded-lg border border-[#E2E8F0] bg-white/95 px-2.5 py-1.5 text-[11px] font-mono-tabular shadow-sm pointer-events-none">
                <div className="text-[#64748B]">{resourceSeries[hoverIdx].time}</div>
                <div className="text-[#4F46E5]">
                  CPU: {resourceSeries[hoverIdx].cpu.toFixed(1)}%
                </div>
                <div className="text-[#059669]">
                  MEM: {resourceSeries[hoverIdx].mem.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-[11.5px] text-[#6B7280] pt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
              CPU
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              MEM
            </span>
          </div>
        </div>

        {/* 2. 告警趋势 (近24小时) */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-[13.5px] font-semibold text-[#111827]">
              告警趋势 (近24小时)
            </h3>
          </div>

          <svg viewBox="0 0 420 190" className="w-full h-[200px]">
            <line
              x1="28"
              y1="14"
              x2="404"
              y2="14"
              stroke="#F1F5F9"
              strokeWidth="1"
            />
            <text
              x="22"
              y="18"
              textAnchor="end"
              className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
            >
              {Math.max(1, activeAlertsCount)}
            </text>

            <line
              x1="28"
              y1="164"
              x2="404"
              y2="164"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x="22"
              y="167"
              textAnchor="end"
              className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
            >
              0
            </text>

            {/* Series lines matching 24h quiet baseline or active spikes */}
            <path
              d="M28,164 L96,164 L164,164 L232,164 L300,164 L404,164"
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
            />
            <path
              d="M28,164 L96,164 L164,164 L232,164 L300,164 L404,164"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <path
              d={
                activeAlertsCount > 0
                  ? "M28,164 L96,164 L164,142 L232,164 L300,120 L404,154"
                  : "M28,164 L96,164 L164,164 L232,164 L300,164 L404,164"
              }
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.2"
            />

            {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map(
              (t, idx) => (
                <text
                  key={t}
                  x={28 + idx * 72}
                  y="182"
                  textAnchor="middle"
                  className="fill-[#9CA3AF] text-[9.5px] font-mono-tabular"
                >
                  {t}
                </text>
              )
            )}
          </svg>

          <div className="flex items-center justify-center gap-4 text-[11.5px] text-[#6B7280] pt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              严重
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              警告
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              信息
            </span>
          </div>
        </div>

        {/* 3. 设备健康 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[13.5px] font-semibold text-[#111827]">
              设备健康
            </h3>
            <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {activeAlertsCount === 0
                  ? "所有设备运行正常"
                  : `${activeAlertsCount} 项告警待关注`}
              </span>
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div
              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center ${
                activeAlertsCount === 0
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-[#F59E0B] text-[#F59E0B]"
              }`}
            >
              {activeAlertsCount === 0 ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <p
              className={`mt-3 text-[13px] font-medium ${
                activeAlertsCount === 0 ? "text-[#10B981]" : "text-[#D97706]"
              }`}
            >
              {activeAlertsCount === 0
                ? "所有设备运行正常"
                : `当前有 ${activeAlertsCount} 条告警需排查`}
            </p>
            <p className="mt-1 text-[11.5px] text-[#9CA3AF]">
              在线率 {devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 100}% · 采集中 {collectingCount} 台
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onNavigate("gw-ops-monitor")}
              className="text-[11.5px] font-medium text-[#059669] hover:underline cursor-pointer"
            >
              进入运维监控详情
            </button>
          </div>
        </div>
      </div>

      {/* Bottom 3-column Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. CPU 使用率 / 系统资源仪表 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <h3 className="text-[13.5px] font-semibold text-[#111827]">
            CPU 使用率
          </h3>

          <div className="py-5 flex items-center justify-around gap-2">
            <CircularGauge value={cpuUsage} label="CPU" color="#2563EB" />
            <CircularGauge value={memUsage} label="MEM" color="#2563EB" />
            <CircularGauge value={diskUsage} label="DISK" color="#2563EB" />
          </div>

          <div className="text-center text-[11.5px] text-[#9CA3AF] font-mono-tabular">
            {memGbUsed} GB / 16.0 GB
          </div>
        </div>

        {/* 2. 设备状态分布 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <h3 className="text-[13.5px] font-semibold text-[#111827]">
            设备状态分布
          </h3>

          <div className="py-4 flex items-center justify-center gap-8">
            <svg viewBox="0 0 110 110" className="w-[116px] h-[116px] shrink-0">
              <circle
                cx="55"
                cy="55"
                r={donutRadius}
                fill="none"
                stroke="#64748B"
                strokeWidth="16"
              />
              <circle
                cx="55"
                cy="55"
                r={donutRadius}
                fill="none"
                stroke="#16A34A"
                strokeWidth="16"
                strokeDasharray={`${onlineDash} ${donutCirc}`}
                transform="rotate(-90 55 55)"
              />
            </svg>

            <div className="space-y-2.5 min-w-[140px] text-[12.5px]">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[#4B5563]">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  在线
                </span>
                <span className="font-semibold text-[#111827] font-mono-tabular">
                  {onlineCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[#4B5563]">
                  <span className="w-2 h-2 rounded-full bg-[#64748B]" />
                  离线
                </span>
                <span className="font-semibold text-[#111827] font-mono-tabular">
                  {offlineCount}
                </span>
              </div>
              <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between gap-4">
                <span className="font-medium text-[#374151]">设备总数</span>
                <span className="font-bold text-[#111827] font-mono-tabular">
                  {devices.length}
                </span>
              </div>
            </div>
          </div>

          <div className="h-3" />
        </div>

        {/* 3. 协议支持 (12 种) */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13.5px] font-semibold text-[#111827]">
              协议支持 ({SUPPORTED_PROTOCOLS.length} 种)
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 py-2">
            {SUPPORTED_PROTOCOLS.map((proto) => (
              <button
                key={proto.id}
                type="button"
                onClick={() => onNavigate("gw-devices", proto.id)}
                title={`点击查看 ${proto.label} 接入设备`}
                className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#10B981] hover:bg-[#ECFDF5] hover:text-[#059669] px-2.5 py-1 text-[12px] font-medium text-[#374151] transition-colors cursor-pointer whitespace-nowrap"
              >
                {proto.label}
              </button>
            ))}
          </div>

          <div className="pt-2 text-[11.5px] text-[#9CA3AF]">
            支持南向工业总线与工业视觉协议自动解析与边缘采集
          </div>
        </div>
      </div>
    </div>
  );
}
