import {
  CheckCircle2,
  Download,
  KeyRound,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useState } from "react";

export function GatewaySecurity() {
  const [tlsEnabled, setTlsEnabled] = useState(true);
  const [apiAuthEnabled, setApiAuthEnabled] = useState(true);
  const [firmwareState, setFirmwareState] = useState<
    "current" | "checking" | "available"
  >("current");
  const [banner, setBanner] = useState<string | null>(null);

  const [firewallRules, setFirewallRules] = useState([
    { port: "443 / TCP", service: "HTTPS 控制台与 WebSocket", action: "ALLOW", source: "0.0.0.0/0", enabled: true },
    { port: "502 / TCP", service: "Modbus TCP 南向采集", action: "ALLOW", source: "192.168.0.0/16", enabled: true },
    { port: "8883 / TCP", service: "MQTT over TLS 北向通道", action: "ALLOW", source: "WAN", enabled: true },
    { port: "554 / TCP", service: "RTSP 工业视觉拉流", action: "ALLOW", source: "192.168.1.0/24", enabled: true },
    { port: "22 / TCP", service: "SSH 运维调试终端", action: "RESTRICT", source: "192.168.1.100", enabled: false },
  ]);

  const notify = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 3200);
  };

  const handleDownloadBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      firmware: "v1.0.0",
      security: { tlsEnabled, apiAuthEnabled, firewallRules },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gateway-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify("已生成并下载完整网关配置备份文件");
  };

  const handleCheckFirmware = () => {
    setFirmwareState("checking");
    setTimeout(() => {
      setFirmwareState("available");
    }, 650);
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <h2 className="text-[15px] font-bold text-[#111827]">
            安全防护与系统维护
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 text-[12px] font-medium text-[#374151] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出全量备份</span>
          </button>
          <button
            type="button"
            onClick={() => notify("已发送安全重启指令，核心采集进程平滑重连中")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] px-3 py-1.5 text-[12px] font-medium text-[#DC2626] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>安全重启服务</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 证书与鉴权 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#111827] pb-2 border-b border-[#F3F4F6]">
            <KeyRound className="w-4 h-4 text-[#16A34A]" />
            <span>TLS 双向认证与 API 访问控制</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="font-medium text-[#111827]">北向 MQTT TLS 1.3 加密传输</div>
              <div className="text-[11.5px] text-[#6B7280]">
                CA 根证书有效期至 2028-11-17
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTlsEnabled((v) => !v)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium cursor-pointer ${
                tlsEnabled
                  ? "bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]"
                  : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {tlsEnabled ? "已开启" : "已关闭"}
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-[#F3F4F6] pt-3">
            <div>
              <div className="font-medium text-[#111827]">WebSocket / REST Token 鉴权</div>
              <div className="text-[11.5px] text-[#6B7280]">
                禁止未签名请求访问设备控制接口
              </div>
            </div>
            <button
              type="button"
              onClick={() => setApiAuthEnabled((v) => !v)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium cursor-pointer ${
                apiAuthEnabled
                  ? "bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]"
                  : "bg-[#F3F4F6] text-[#6B7280]"
              }`}
            >
              {apiAuthEnabled ? "已开启" : "已关闭"}
            </button>
          </div>
        </div>

        {/* 固件升级 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#111827] pb-2 border-b border-[#F3F4F6]">
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>OTA 固件与运行时升级</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[#6B7280]">当前固件版本</div>
              <div className="text-[18px] font-bold text-[#111827] font-mono-tabular">
                v1.0.0-edge-ai
              </div>
            </div>

            {firmwareState === "available" ? (
              <button
                type="button"
                onClick={() => {
                  setFirmwareState("current");
                  notify("固件包 v1.1.0 校验完成，已加入定时维护窗口升级队列");
                }}
                className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-2 text-[12px] font-medium text-white cursor-pointer"
              >
                发现新版本 v1.1.0 · 立即升级
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCheckFirmware}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] hover:bg-[#F9FAFB] px-3.5 py-2 text-[12px] font-medium text-[#374151] cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    firmwareState === "checking" ? "animate-spin" : ""
                  }`}
                />
                <span>
                  {firmwareState === "checking" ? "检查更新中..." : "检查 OTA 更新"}
                </span>
              </button>
            )}
          </div>
          <p className="text-[12px] text-[#6B7280]">
            支持双分区 A/B 热备回滚机制，升级异常自动回退至上一稳定镜像。
          </p>
        </div>

        {/* 防火墙策略 */}
        <div className="lg:col-span-2 rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] font-bold text-[13.5px] text-[#111827]">
            端口访问与防火墙规则
          </div>
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563]">
                <th className="py-2.5 px-4">端口 / 协议</th>
                <th className="py-2.5 px-4">服务说明</th>
                <th className="py-2.5 px-4">策略</th>
                <th className="py-2.5 px-4">授权来源</th>
                <th className="py-2.5 px-4 text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {firewallRules.map((rule, idx) => (
                <tr key={rule.port} className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-mono-tabular font-semibold">
                    {rule.port}
                  </td>
                  <td className="py-3 px-4">{rule.service}</td>
                  <td className="py-3 px-4 font-mono-tabular">{rule.action}</td>
                  <td className="py-3 px-4 font-mono-tabular text-[#6B7280]">
                    {rule.source}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setFirewallRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, enabled: !r.enabled } : r
                          )
                        )
                      }
                      className={`rounded border px-2.5 py-0.5 text-[11px] font-medium cursor-pointer ${
                        rule.enabled
                          ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                          : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {rule.enabled ? "放行" : "拦截"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
