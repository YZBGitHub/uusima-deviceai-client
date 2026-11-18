import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentPreferences } from "./AgentWorkspace";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  preferences?: AgentPreferences;
  onChangePreferences?: (next: AgentPreferences) => void;
  onClearAllHistory?: () => void;
}

type SettingsTab = "ip" | "device-id" | "wifi";

interface NicOption {
  id: string;
  label: string;
  mac: string;
  currentIp: string;
}

const NIC_OPTIONS: NicOption[] = [
  {
    id: "eth0",
    label: "eth0 (上行千兆以太网卡)",
    mac: "00:1A:2B:3C:4D:01",
    currentIp: "192.168.1.10",
  },
  {
    id: "eth1",
    label: "eth1 (南向工业总线网卡)",
    mac: "00:1A:2B:3C:4D:02",
    currentIp: "192.168.0.1",
  },
  {
    id: "wlan0",
    label: "wlan0 (无线 WiFi 网卡)",
    mac: "00:1A:2B:3C:4D:03",
    currentIp: "192.168.31.108",
  },
];

interface WifiNetworkItem {
  ssid: string;
  signal: number; // dBm
  security: "WPA2-PSK" | "WPA3-SAE" | "OPEN";
  band: "2.4GHz" | "5GHz";
}

const INITIAL_WIFI_LIST: WifiNetworkItem[] = [
  { ssid: "NLE-IIoT-Lab-5G", signal: -45, security: "WPA2-PSK", band: "5GHz" },
  { ssid: "EdgeGateway-Net", signal: -58, security: "WPA3-SAE", band: "5GHz" },
  { ssid: "SmartFactory-2.4G", signal: -66, security: "WPA2-PSK", band: "2.4GHz" },
  { ssid: "Lab-Test-Open", signal: -74, security: "OPEN", band: "2.4GHz" },
];

const STORAGE_KEY = "gateway_system_settings_v1";

interface SavedSystemSettings {
  nic: string;
  ipv4Mode: "" | "dhcp" | "static";
  staticIp: string;
  subnetMask: string;
  gateway: string;
  dns: string;
  deviceUniqueId: string;
  wifiEnabled: boolean;
  wifiSsid: string;
  wifiSecurity: "WPA2-PSK" | "WPA3-SAE" | "OPEN";
  wifiPassword: string;
  wifiIpMode: "dhcp" | "static";
  wifiStaticIp: string;
  wifiConnectedSsid: string;
}

const DEFAULT_SETTINGS: SavedSystemSettings = {
  nic: "",
  ipv4Mode: "",
  staticIp: "192.168.1.10",
  subnetMask: "255.255.255.0",
  gateway: "192.168.1.1",
  dns: "223.5.5.5",
  deviceUniqueId: "NLE-GW-20261118-8F3A9C10",
  wifiEnabled: true,
  wifiSsid: "NLE-IIoT-Lab-5G",
  wifiSecurity: "WPA2-PSK",
  wifiPassword: "",
  wifiIpMode: "dhcp",
  wifiStaticIp: "192.168.31.108",
  wifiConnectedSsid: "NLE-IIoT-Lab-5G",
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ip");

  const [persisted, setPersisted] = useState<SavedSystemSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // ignore storage failure
    }
    return DEFAULT_SETTINGS;
  });

  // Draft form state so "取 消" discards unsaved changes cleanly
  const [nic, setNic] = useState(persisted.nic);
  const [ipv4Mode, setIpv4Mode] = useState<"" | "dhcp" | "static">(
    persisted.ipv4Mode
  );
  const [staticIp, setStaticIp] = useState(persisted.staticIp);
  const [subnetMask, setSubnetMask] = useState(persisted.subnetMask);
  const [gateway, setGateway] = useState(persisted.gateway);
  const [dns, setDns] = useState(persisted.dns);

  const [deviceUniqueId, setDeviceUniqueId] = useState(
    persisted.deviceUniqueId
  );
  const [copiedId, setCopiedId] = useState(false);

  const [wifiEnabled, setWifiEnabled] = useState(persisted.wifiEnabled);
  const [wifiSsid, setWifiSsid] = useState(persisted.wifiSsid);
  const [wifiSecurity, setWifiSecurity] = useState<
    "WPA2-PSK" | "WPA3-SAE" | "OPEN"
  >(persisted.wifiSecurity);
  const [wifiPassword, setWifiPassword] = useState(persisted.wifiPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [wifiIpMode, setWifiIpMode] = useState<"dhcp" | "static">(
    persisted.wifiIpMode
  );
  const [wifiStaticIp, setWifiStaticIp] = useState(persisted.wifiStaticIp);
  const [wifiConnectedSsid, setWifiConnectedSsid] = useState(
    persisted.wifiConnectedSsid
  );
  const [wifiList, setWifiList] = useState<WifiNetworkItem[]>(INITIAL_WIFI_LIST);
  const [scanningWifi, setScanningWifi] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setNic(persisted.nic);
      setIpv4Mode(persisted.ipv4Mode);
      setStaticIp(persisted.staticIp);
      setSubnetMask(persisted.subnetMask);
      setGateway(persisted.gateway);
      setDns(persisted.dns);
      setDeviceUniqueId(persisted.deviceUniqueId);
      setWifiEnabled(persisted.wifiEnabled);
      setWifiSsid(persisted.wifiSsid);
      setWifiSecurity(persisted.wifiSecurity);
      setWifiPassword(persisted.wifiPassword);
      setWifiIpMode(persisted.wifiIpMode);
      setWifiStaticIp(persisted.wifiStaticIp);
      setWifiConnectedSsid(persisted.wifiConnectedSsid);
      setFeedback(null);
      setShowPassword(false);
    }
  }, [open, persisted]);

  if (!open) return null;

  const isValidIp = (ip: string) =>
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(
      ip.trim()
    );

  const handleScanWifi = () => {
    setScanningWifi(true);
    setFeedback(null);
    window.setTimeout(() => {
      setWifiList((prev) =>
        prev.map((item) => ({
          ...item,
          signal: Math.min(
            -38,
            Math.max(-85, item.signal + Math.round((Math.random() - 0.5) * 8))
          ),
        }))
      );
      setScanningWifi(false);
    }, 550);
  };

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceUniqueId);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleRegenerateDeviceId = () => {
    const hex = Math.random().toString(16).slice(2, 10).toUpperCase();
    setDeviceUniqueId(`NLE-GW-20261118-${hex}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (activeTab === "ip") {
      if (!nic) {
        setFeedback({ type: "error", text: "请选择网卡" });
        return;
      }
      if (!ipv4Mode) {
        setFeedback({ type: "error", text: "请选择配置方式" });
        return;
      }
      if (ipv4Mode === "static") {
        if (!isValidIp(staticIp) || !isValidIp(subnetMask) || !isValidIp(gateway)) {
          setFeedback({
            type: "error",
            text: "请填写有效的 IPv4 地址、子网掩码和默认网关",
          });
          return;
        }
      }
    } else if (activeTab === "device-id") {
      if (!deviceUniqueId.trim()) {
        setFeedback({ type: "error", text: "设备唯一ID不能为空" });
        return;
      }
    } else if (activeTab === "wifi") {
      if (wifiEnabled) {
        if (!wifiSsid.trim()) {
          setFeedback({ type: "error", text: "请输入或选择要连接的 WiFi 名称 (SSID)" });
          return;
        }
        if (wifiSecurity !== "OPEN" && wifiPassword.length > 0 && wifiPassword.length < 8) {
          setFeedback({ type: "error", text: "WiFi 密码长度至少为 8 位" });
          return;
        }
        if (wifiIpMode === "static" && !isValidIp(wifiStaticIp)) {
          setFeedback({ type: "error", text: "请填写有效的无线静态 IPv4 地址" });
          return;
        }
      }
    }

    const nextConnectedSsid =
      activeTab === "wifi"
        ? wifiEnabled
          ? wifiSsid.trim()
          : ""
        : wifiConnectedSsid;

    if (activeTab === "wifi") {
      setWifiConnectedSsid(nextConnectedSsid);
    }

    const nextSettings: SavedSystemSettings = {
      nic,
      ipv4Mode,
      staticIp: staticIp.trim(),
      subnetMask: subnetMask.trim(),
      gateway: gateway.trim(),
      dns: dns.trim(),
      deviceUniqueId: deviceUniqueId.trim(),
      wifiEnabled,
      wifiSsid: wifiSsid.trim(),
      wifiSecurity,
      wifiPassword,
      wifiIpMode,
      wifiStaticIp: wifiStaticIp.trim(),
      wifiConnectedSsid: nextConnectedSsid,
    };

    setPersisted(nextSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    } catch {
      // ignore
    }

    setFeedback({
      type: "success",
      text:
        activeTab === "ip"
          ? `已保存网卡 ${nic} 的 IPv4 配置（${ipv4Mode === "dhcp" ? "DHCP 自动获取" : staticIp}）`
          : activeTab === "device-id"
            ? `已保存设备唯一ID：${deviceUniqueId.trim()}`
            : wifiEnabled
              ? `已保存并连接至 WiFi「${wifiSsid.trim()}」`
              : "已关闭无线 WiFi 模块并保存设置",
    });
  };

  const selectedNicInfo = NIC_OPTIONS.find((n) => n.id === nic);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-[520px] rounded-xl border border-[#E5E7EB] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)] overflow-hidden">
        {/* Top Modal Header matching screenshot */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2
            id="settings-modal-title"
            className="text-[17px] font-semibold text-[#1F2937] tracking-tight"
          >
            系统设置
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭系统设置"
            className="p-1 rounded-md text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#4B5563] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Centered Tabs matching screenshot + WiFi配置 */}
        <div className="border-b border-[#F1F5F9] px-6 flex items-center justify-center gap-8">
          {[
            { id: "ip" as const, label: "IP地址设置" },
            { id: "device-id" as const, label: "设备唯一ID" },
            { id: "wifi" as const, label: "WiFi配置" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setFeedback(null);
                }}
                className={`relative pb-2.5 pt-1 text-[14px] transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "font-semibold text-[#111827]"
                    : "font-normal text-[#4B5563] hover:text-[#111827]"
                }`}
              >
                <span>{tab.label}</span>
                {active && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-[2.5px] rounded-full bg-[#1677FF]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
          {activeTab === "ip" && (
            <div className="space-y-4">
              {/* * 选择网卡 */}
              <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                <label
                  htmlFor="sys-nic-select"
                  className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                >
                  <span className="text-[#EF4444] mr-1">*</span>
                  选择网卡：
                </label>
                <select
                  id="sys-nic-select"
                  value={nic}
                  onChange={(e) => {
                    setNic(e.target.value);
                    setFeedback(null);
                  }}
                  className={`w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] focus:border-[#1677FF] focus:outline-none cursor-pointer ${
                    nic ? "text-[#111827]" : "text-[#9CA3AF]"
                  }`}
                >
                  <option value="">请选择网卡</option>
                  {NIC_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id} className="text-[#111827]">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedNicInfo && (
                <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                  <span className="text-right text-[12px] text-[#6B7280]">
                    硬件信息：
                  </span>
                  <div className="text-[12px] font-mono-tabular text-[#4B5563] bg-[#F9FAFB] border border-[#E5E7EB] rounded-md px-3 py-1.5 flex items-center justify-between">
                    <span>MAC: {selectedNicInfo.mac}</span>
                    <span>当前: {selectedNicInfo.currentIp}</span>
                  </div>
                </div>
              )}

              {/* * 配置IPv4地址 */}
              <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                <label
                  htmlFor="sys-ipv4-mode"
                  className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                >
                  <span className="text-[#EF4444] mr-1">*</span>
                  配置IPv4地址：
                </label>
                <select
                  id="sys-ipv4-mode"
                  value={ipv4Mode}
                  onChange={(e) => {
                    setIpv4Mode(e.target.value as "" | "dhcp" | "static");
                    setFeedback(null);
                  }}
                  className={`w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] focus:border-[#1677FF] focus:outline-none cursor-pointer ${
                    ipv4Mode ? "text-[#111827]" : "text-[#9CA3AF]"
                  }`}
                >
                  <option value="">请选择配置方式</option>
                  <option value="dhcp" className="text-[#111827]">
                    自动获取 (DHCP)
                  </option>
                  <option value="static" className="text-[#111827]">
                    手动静态配置 (Static IP)
                  </option>
                </select>
              </div>

              {ipv4Mode === "static" && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-static-ip"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      <span className="text-[#EF4444] mr-1">*</span>
                      IPv4 地址：
                    </label>
                    <input
                      id="sys-static-ip"
                      type="text"
                      value={staticIp}
                      onChange={(e) => setStaticIp(e.target.value)}
                      placeholder="192.168.1.10"
                      className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-subnet-mask"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      <span className="text-[#EF4444] mr-1">*</span>
                      子网掩码：
                    </label>
                    <input
                      id="sys-subnet-mask"
                      type="text"
                      value={subnetMask}
                      onChange={(e) => setSubnetMask(e.target.value)}
                      placeholder="255.255.255.0"
                      className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-gateway"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      <span className="text-[#EF4444] mr-1">*</span>
                      默认网关：
                    </label>
                    <input
                      id="sys-gateway"
                      type="text"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-dns"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      首选 DNS：
                    </label>
                    <input
                      id="sys-dns"
                      type="text"
                      value={dns}
                      onChange={(e) => setDns(e.target.value)}
                      placeholder="223.5.5.5"
                      className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "device-id" && (
            <div className="space-y-4">
              <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                <label
                  htmlFor="sys-device-uid"
                  className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                >
                  <span className="text-[#EF4444] mr-1">*</span>
                  设备唯一ID：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="sys-device-uid"
                    type="text"
                    value={deviceUniqueId}
                    onChange={(e) => setDeviceUniqueId(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyDeviceId}
                    title="复制设备唯一ID"
                    className="h-9 px-2.5 rounded-md border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-[#4B5563] inline-flex items-center gap-1 text-[12px] cursor-pointer shrink-0"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span className="text-[#16A34A]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                <span className="text-right text-[13px] text-[#4B5563]">
                  绑定策略：
                </span>
                <div className="flex items-center justify-between rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[12px] text-[#4B5563]">
                  <span>绑定主板 UUID 与 eth0 MAC 地址</span>
                  <button
                    type="button"
                    onClick={handleRegenerateDeviceId}
                    className="inline-flex items-center gap-1 text-[#1677FF] hover:underline font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>重新生成</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wifi" && (
            <div className="space-y-4">
              {/* WiFi Enable Switch & Current Status */}
              <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                <span className="text-right text-[13.5px] text-[#374151] whitespace-nowrap">
                  <span className="text-[#EF4444] mr-1">*</span>
                  无线开关：
                </span>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={wifiEnabled}
                    onClick={() => setWifiEnabled((v) => !v)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12.5px] font-medium cursor-pointer transition-colors ${
                      wifiEnabled
                        ? "border-[#93C5FD] bg-[#EFF6FF] text-[#1677FF]"
                        : "border-[#D1D5DB] bg-[#F9FAFB] text-[#6B7280]"
                    }`}
                  >
                    {wifiEnabled ? (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>已开启 (wlan0)</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3.5 h-3.5" />
                        <span>已关闭</span>
                      </>
                    )}
                  </button>

                  {wifiEnabled && wifiConnectedSsid && (
                    <span className="text-[11.5px] text-[#059669] font-medium truncate">
                      当前已连：{wifiConnectedSsid}
                    </span>
                  )}
                </div>
              </div>

              {wifiEnabled && (
                <>
                  {/* Available WiFi Scan List */}
                  <div className="grid grid-cols-[128px_1fr] items-start gap-3">
                    <span className="text-right text-[13px] text-[#4B5563] pt-1.5 whitespace-nowrap">
                      可用热点：
                    </span>
                    <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] overflow-hidden">
                      <div className="px-3 py-1.5 border-b border-[#E5E7EB] bg-white flex items-center justify-between text-[11.5px] text-[#6B7280]">
                        <span>点击热点快速填入 SSID</span>
                        <button
                          type="button"
                          onClick={handleScanWifi}
                          disabled={scanningWifi}
                          className="inline-flex items-center gap-1 text-[#1677FF] hover:underline font-medium cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-3 h-3 ${scanningWifi ? "animate-spin" : ""}`}
                          />
                          <span>{scanningWifi ? "扫描中..." : "刷新热点"}</span>
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto divide-y divide-[#F1F5F9]">
                        {wifiList.map((net) => {
                          const selected = wifiSsid === net.ssid;
                          return (
                            <button
                              key={net.ssid}
                              type="button"
                              onClick={() => {
                                setWifiSsid(net.ssid);
                                setWifiSecurity(net.security);
                                if (net.security === "OPEN") setWifiPassword("");
                                setFeedback(null);
                              }}
                              className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-[12px] transition-colors cursor-pointer ${
                                selected
                                  ? "bg-[#EFF6FF] text-[#1677FF] font-semibold"
                                  : "bg-white hover:bg-[#F8FAFC] text-[#374151]"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5 truncate">
                                <Wifi className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{net.ssid}</span>
                                <span className="text-[10.5px] text-[#9CA3AF] font-normal">
                                  {net.band}
                                </span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] text-[#6B7280] shrink-0">
                                {net.security !== "OPEN" && (
                                  <Lock className="w-3 h-3" />
                                )}
                                <span>{net.signal} dBm</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* * WiFi 名称 (SSID) */}
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-wifi-ssid"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      <span className="text-[#EF4444] mr-1">*</span>
                      WiFi 名称：
                    </label>
                    <input
                      id="sys-wifi-ssid"
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="请输入或选择 WiFi SSID"
                      className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] text-[#111827] focus:border-[#1677FF] focus:outline-none"
                    />
                  </div>

                  {/* * 加密方式 */}
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-wifi-sec"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      <span className="text-[#EF4444] mr-1">*</span>
                      加密方式：
                    </label>
                    <select
                      id="sys-wifi-sec"
                      value={wifiSecurity}
                      onChange={(e) =>
                        setWifiSecurity(
                          e.target.value as "WPA2-PSK" | "WPA3-SAE" | "OPEN"
                        )
                      }
                      className="w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1677FF] focus:outline-none cursor-pointer"
                    >
                      <option value="WPA2-PSK">WPA2-PSK (AES)</option>
                      <option value="WPA3-SAE">WPA3-SAE</option>
                      <option value="OPEN">开放网络 (无密码)</option>
                    </select>
                  </div>

                  {/* WiFi 密码 */}
                  {wifiSecurity !== "OPEN" && (
                    <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                      <label
                        htmlFor="sys-wifi-pass"
                        className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                      >
                        <span className="text-[#EF4444] mr-1">*</span>
                        WiFi 密码：
                      </label>
                      <div className="relative">
                        <input
                          id="sys-wifi-pass"
                          type={showPassword ? "text" : "password"}
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          placeholder="请输入无线网络密码（至少 8 位）"
                          className="w-full h-9 rounded-md border border-[#D1D5DB] pl-3 pr-9 text-[13px] text-[#111827] focus:border-[#1677FF] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "隐藏密码" : "显示密码"}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 无线 IP 模式 */}
                  <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                    <label
                      htmlFor="sys-wifi-ipmode"
                      className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                    >
                      IP 获取方式：
                    </label>
                    <select
                      id="sys-wifi-ipmode"
                      value={wifiIpMode}
                      onChange={(e) =>
                        setWifiIpMode(e.target.value as "dhcp" | "static")
                      }
                      className="w-full h-9 rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#111827] focus:border-[#1677FF] focus:outline-none cursor-pointer"
                    >
                      <option value="dhcp">DHCP 自动获取</option>
                      <option value="static">静态 IPv4 地址</option>
                    </select>
                  </div>

                  {wifiIpMode === "static" && (
                    <div className="grid grid-cols-[128px_1fr] items-center gap-3">
                      <label
                        htmlFor="sys-wifi-static-ip"
                        className="text-right text-[13.5px] text-[#374151] whitespace-nowrap"
                      >
                        <span className="text-[#EF4444] mr-1">*</span>
                        无线 IP 地址：
                      </label>
                      <input
                        id="sys-wifi-static-ip"
                        type="text"
                        value={wifiStaticIp}
                        onChange={(e) => setWifiStaticIp(e.target.value)}
                        placeholder="192.168.31.108"
                        className="w-full h-9 rounded-md border border-[#D1D5DB] px-3 text-[13px] font-mono-tabular text-[#111827] focus:border-[#1677FF] focus:outline-none"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-[12.5px] flex items-center gap-2 ${
                feedback.type === "error"
                  ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                  : "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]"
              }`}
            >
              {feedback.type === "success" && (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Bottom Centered Buttons matching screenshot */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-w-[84px] h-9 rounded-md border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] px-5 text-[13.5px] font-medium text-[#374151] transition-colors cursor-pointer"
            >
              取 消
            </button>
            <button
              type="submit"
              className="min-w-[96px] h-9 rounded-md bg-[#1677FF] hover:bg-[#0958D9] px-5 text-[13.5px] font-medium text-white transition-colors cursor-pointer shadow-xs"
            >
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
