import { CheckCircle2, Globe, HardDrive, Network, Save, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export function GatewaySysConfig() {
  const [gatewayName, setGatewayName] = useState("AI-Edge-Gateway-Lab01");
  const [gatewaySn, setGatewaySn] = useState("NLE-GW-20261117-001");
  const [timezone, setTimezone] = useState("Asia/Shanghai (UTC+8)");
  const [ntpServer, setNtpServer] = useState("ntp.aliyun.com");

  const [eth0Ip, setEth0Ip] = useState("192.168.1.10");
  const [eth0Gw, setEth0Gw] = useState("192.168.1.1");
  const [eth1Ip, setEth1Ip] = useState("192.168.0.1");
  const [retentionDays, setRetentionDays] = useState(30);
  const [downsampleLimit, setDownsampleLimit] = useState(500);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg("网关系统参数、网络接口与存储策略已应用并生效。");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#16A34A]" />
          <h2 className="text-[15px] font-bold text-[#111827]">
            边缘网关系统配置
          </h2>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>保存并应用配置</span>
        </button>
      </div>

      {savedMsg && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 基础信息与时钟 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3.5 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#111827] pb-2 border-b border-[#F3F4F6]">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <span>主机标识与 NTP 时钟同步</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                网关主机名
              </label>
              <input
                type="text"
                value={gatewayName}
                onChange={(e) => setGatewayName(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                设备序列号 (SN)
              </label>
              <input
                type="text"
                readOnly
                value={gatewaySn}
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 font-mono-tabular text-[#6B7280]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                系统时区
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2"
              >
                <option>Asia/Shanghai (UTC+8)</option>
                <option>UTC (UTC+0)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                NTP 校时服务器
              </label>
              <input
                type="text"
                value={ntpServer}
                onChange={(e) => setNtpServer(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
          </div>
        </div>

        {/* 网络接口 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3.5 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#111827] pb-2 border-b border-[#F3F4F6]">
            <Network className="w-4 h-4 text-[#16A34A]" />
            <span>网络接口配置 (WAN / LAN / 4G)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                ETH0 (上行网口 IP)
              </label>
              <input
                type="text"
                value={eth0Ip}
                onChange={(e) => setEth0Ip(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                默认网关
              </label>
              <input
                type="text"
                value={eth0Gw}
                onChange={(e) => setEth0Gw(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                ETH1 (南向工业总线网口 IP)
              </label>
              <input
                type="text"
                value={eth1Ip}
                onChange={(e) => setEth1Ip(e.target.value)}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                4G LTE 备用链路 (wwan0)
              </label>
              <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-[#059669] font-mono-tabular text-[12px]">
                信号强度 -68 dBm · 自动热备中
              </div>
            </div>
          </div>
        </div>

        {/* 本地存储策略 */}
        <div className="lg:col-span-2 rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3.5 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#111827] pb-2 border-b border-[#F3F4F6]">
            <HardDrive className="w-4 h-4 text-[#6366F1]" />
            <span>时序存储与降采样策略</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                历史数据保留天数
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                查询默认降采样点数上限
              </label>
              <input
                type="number"
                value={downsampleLimit}
                onChange={(e) => setDownsampleLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
              />
            </div>
            <div>
              <label className="block font-medium text-[#374151] mb-1">
                当前磁盘使用情况
              </label>
              <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 font-mono-tabular text-[#374151]">
                已用 6.3% (1.01 GB / 16.0 GB)
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
