import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Pause,
  Play,
  Terminal,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type { GatewayAlertItem, GatewayLogEntry } from "../../types/gateway";

interface GatewayOpsMonitorProps {
  alerts: GatewayAlertItem[];
  onUpdateAlerts: (
    updater: (prev: GatewayAlertItem[]) => GatewayAlertItem[]
  ) => void;
  logs: GatewayLogEntry[];
  onAppendLog: (entry: GatewayLogEntry) => void;
}

export function GatewayOpsMonitor({
  alerts,
  onUpdateAlerts,
  logs,
  onAppendLog,
}: GatewayOpsMonitorProps) {
  const [tab, setTab] = useState<"alerts" | "logs" | "diag">("alerts");
  const [logLevelFilter, setLogLevelFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");
  const [paused, setPaused] = useState(false);

  // Diagnostics tool state
  const [diagTarget, setDiagTarget] = useState("192.168.0.7");
  const [diagPort, setDiagPort] = useState("502");
  const [diagOutput, setDiagOutput] = useState<string[]>([
    "[诊断就绪] 输入目标 IP 与端口进行 TCP/Modbus/ICMP 连通性探测。",
  ]);

  const handleAckAlert = (id: string) => {
    onUpdateAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleInjectTestAlert = () => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const newAlert: GatewayAlertItem = {
      id: `alt-${Date.now()}`,
      severity: "warning",
      title: "温度传感器模拟采样超出设定阈值 (33.5℃)",
      deviceName: "sim-temperature-01",
      detail: "当前温度 33.5℃ > 阈值 32.0℃，建议检查通风或联动继电器状态",
      timestamp: now,
      acknowledged: false,
    };
    onUpdateAlerts((prev) => [newAlert, ...prev]);
    onAppendLog({
      id: `log-${Date.now()}`,
      timestamp: `${now}.104`,
      level: "WARN",
      module: "ops.alert_engine",
      message: `triggered warning alert on sim-temperature-01 (val=33.5)`,
    });
  };

  const handleRunDiag = (mode: "ping" | "modbus" | "rtsp") => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const ms = (1.2 + Math.random() * 4.5).toFixed(2);
    const lines =
      mode === "ping"
        ? [
            `[${now}] PING ${diagTarget} (64 bytes): icmp_seq=1 ttl=64 time=${ms} ms`,
            `[${now}] PING ${diagTarget} (64 bytes): icmp_seq=2 ttl=64 time=${ms} ms`,
            `[${now}] 丢包率 0.0%，平均往返延迟 ${ms} ms`,
          ]
        : mode === "modbus"
          ? [
              `[${now}] TCP 握手 ${diagTarget}:${diagPort} 成功 (${ms} ms)`,
              `[${now}] TX >> 00 01 00 00 00 06 01 03 00 00 00 02`,
              `[${now}] RX << 00 01 00 00 00 07 01 03 04 02 34 00 F6 (CRC/TCP 校验通过)`,
            ]
          : [
              `[${now}] RTSP DESCRIBE rtsp://${diagTarget}:554/Streaming/Channels/101`,
              `[${now}] 200 OK · Video Codec: H.264 High · 1920x1080 @ 25fps`,
            ];

    setDiagOutput((prev) => [...prev, ...lines]);
  };

  const handleExportLogs = () => {
    const text = logs
      .map((l) => `${l.timestamp} [${l.level}] (${l.module}) ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gateway-logs-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleLogs = logs.filter(
    (l) => logLevelFilter === "ALL" || l.level === logLevelFilter
  );

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#16A34A]" />
          <h2 className="text-[15px] font-bold text-[#111827]">
            运维监控与故障诊断中心
          </h2>
        </div>

        <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-[12px] overflow-x-auto max-w-full">
          {[
            { key: "alerts" as const, label: `告警中心 (${alerts.length})` },
            { key: "logs" as const, label: `实时运行日志 (${logs.length})` },
            { key: "diag" as const, label: "网络与协议诊断" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer whitespace-nowrap ${
                tab === item.key
                  ? "bg-[#16A34A] text-white"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "alerts" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12.5px] text-[#6B7280]">
              告警状态实时同步至「用户端 / 仪表盘」活跃告警指标
            </span>
            <button
              type="button"
              onClick={handleInjectTestAlert}
              className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7] px-3 py-1.5 text-[12px] font-medium text-[#B45309] cursor-pointer whitespace-nowrap"
            >
              模拟产生一条阈值告警
            </button>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white divide-y divide-[#F3F4F6]">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      al.severity === "critical"
                        ? "bg-[#FEF2F2] text-[#EF4444]"
                        : al.severity === "warning"
                          ? "bg-[#FFFBEB] text-[#D97706]"
                          : "bg-[#EFF6FF] text-[#2563EB]"
                    }`}
                  >
                    {al.severity === "info" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#111827]">
                        {al.title}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-[#6B7280]">
                        {al.timestamp}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#4B5563]">
                      设备：<span className="font-mono-tabular">{al.deviceName}</span> · {al.detail}
                    </div>
                  </div>
                </div>

                <div>
                  {al.acknowledged ? (
                    <span className="rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-[11.5px] text-[#6B7280]">
                      已确认
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAckAlert(al.id)}
                      className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer"
                    >
                      确认处理
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLogLevelFilter(lvl)}
                  className={`rounded px-2.5 py-1 text-[11.5px] font-mono-tabular font-medium cursor-pointer ${
                    logLevelFilter === lvl
                      ? "bg-[#16A34A] text-white"
                      : "bg-[#F3F4F6] text-[#4B5563]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[12px] text-[#374151] cursor-pointer"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{paused ? "恢复滚动" : "暂停日志"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportLogs}
                className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[12px] text-[#374151] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出日志</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0F172A] text-[#E2E8F0] p-3 sm:p-4 font-mono-tabular text-[11.5px] sm:text-[12px] space-y-2 sm:space-y-1.5 max-h-[380px] overflow-y-auto">
            {visibleLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap sm:flex-nowrap items-start gap-x-2.5 gap-y-0.5">
                <span className="text-[#64748B] shrink-0">{log.timestamp}</span>
                <span
                  className={`shrink-0 sm:w-12 ${
                    log.level === "ERROR"
                      ? "text-red-400"
                      : log.level === "WARN"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  [{log.level}]
                </span>
                <span className="text-sky-300 shrink-0">{log.module}</span>
                <span className="text-[#F1F5F9] break-all w-full sm:w-auto">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "diag" && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Wrench className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span className="font-medium text-[#374151] whitespace-nowrap">目标地址：</span>
              <input
                type="text"
                value={diagTarget}
                onChange={(e) => setDiagTarget(e.target.value)}
                className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-tabular flex-1 sm:w-44 min-w-0"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="font-medium text-[#374151] whitespace-nowrap">端口：</span>
              <input
                type="text"
                value={diagPort}
                onChange={(e) => setDiagPort(e.target.value)}
                className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 font-mono-tabular flex-1 sm:w-24 min-w-0"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRunDiag("ping")}
              className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer"
            >
              ICMP Ping
            </button>
            <button
              type="button"
              onClick={() => handleRunDiag("modbus")}
              className="rounded-lg border border-[#D1D5DB] hover:bg-[#F9FAFB] px-3 py-1.5 text-[12px] font-medium text-[#374151] cursor-pointer"
            >
              Modbus 读测试
            </button>
            <button
              type="button"
              onClick={() => handleRunDiag("rtsp")}
              className="rounded-lg border border-[#D1D5DB] hover:bg-[#F9FAFB] px-3 py-1.5 text-[12px] font-medium text-[#374151] cursor-pointer"
            >
              RTSP 流探测
            </button>
          </div>

          <div className="rounded-xl bg-[#0F172A] text-[#A7F3D0] p-4 font-mono-tabular text-[12px] space-y-1 min-h-[200px]">
            <div className="flex items-center gap-2 text-[#94A3B8] pb-2 border-b border-[#1E293B] mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Edge Gateway Diagnostic Shell</span>
            </div>
            {diagOutput.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
