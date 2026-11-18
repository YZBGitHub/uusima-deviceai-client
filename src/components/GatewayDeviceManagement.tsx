import {
  ArrowUpDown,
  Bot,
  Box,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  GitCompare,
  LayoutGrid,
  Loader2,
  Play,
  Plus,
  Radar,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
  Square,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { SUPPORTED_PROTOCOLS } from "../data/gatewayInitialData";
import type {
  GatewayDeviceCategory,
  GatewayDeviceItem,
  ModbusSubType,
} from "../types/gateway";
import { SimulationImportModal } from "./SimulationImportModal";

function InlineCameraFeed({ device }: { device: GatewayDeviceItem }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [aiOverlay, setAiOverlay] = useState(true);
  const [useLocalWebcam, setUseLocalWebcam] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleLocalWebcam = async () => {
    if (useLocalWebcam) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setUseLocalWebcam(false);
      setWebcamError(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseLocalWebcam(true);
      setWebcamError(null);
    } catch {
      setWebcamError("未检测到本地物理摄像头或未授权访问，继续展示模拟工业RTSP画面。");
    }
  };

  useEffect(() => {
    if (useLocalWebcam) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const renderFrame = () => {
      tick += 1;
      const w = canvas.width;
      const h = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(1, "#1E293B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(148, 163, 184, 0.14)";
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

      ctx.fillStyle = "#263349";
      ctx.fillRect(48, h * 0.42, w - 96, h * 0.34);
      ctx.strokeStyle = "#475569";
      ctx.strokeRect(48, h * 0.42, w - 96, h * 0.34);

      const itemX = 80 + ((tick * 1.2) % (w - 220));
      const itemY = h * 0.51;
      ctx.fillStyle = "#0F766E";
      ctx.fillRect(itemX, itemY, 84, 52);
      ctx.strokeStyle = "#2DD4BF";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(itemX, itemY, 84, 52);

      if (aiOverlay) {
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 2;
        ctx.strokeRect(itemX - 6, itemY - 6, 96, 64);
        ctx.fillStyle = "rgba(34, 197, 94, 0.92)";
        ctx.fillRect(itemX - 6, itemY - 24, 120, 18);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 10.5px JetBrains Mono, monospace";
        ctx.fillText("TARGET  0.98", itemX, itemY - 11);
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
      ctx.fillRect(12, 12, 310, 24);
      ctx.fillStyle = "#E2E8F0";
      ctx.font = "500 11px JetBrains Mono, monospace";
      const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      ctx.fillText(
        `${device.model} | ${device.resolution ?? "1920×1080"} @ ${device.fps ?? 25}fps | ${nowStr}`,
        18,
        28
      );

      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(w - 54, 24, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 10.5px JetBrains Mono, monospace";
      ctx.fillText("LIVE", w - 44, 28);

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [aiOverlay, device.fps, device.model, device.resolution, useLocalWebcam]);

  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${device.model}_snapshot_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start">
      <div className="w-full md:w-[400px] shrink-0 rounded-xl overflow-hidden border border-[#1E293B] bg-black aspect-video">
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
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="flex-1 space-y-3 text-[12.5px]">
        <div>
          <div className="font-semibold text-[#0F172A]">实时视频流信息</div>
          <div className="mt-1 text-[#475569]">{device.sceneLabel}</div>
          <div className="mt-1 font-mono-tabular text-[11.5px] text-[#64748B] break-all">
            流地址：{device.rtspUrl}
          </div>
          <div className="mt-0.5 font-mono-tabular text-[11.5px] text-[#64748B]">
            参数：{device.resolution} · {device.fps} fps
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAiOverlay((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors ${
              aiOverlay
                ? "border-[#10B981] bg-[#ECFDF5] text-[#059669]"
                : "border-[#CBD5E1] bg-white text-[#475569]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI 识别框：{aiOverlay ? "开" : "关"}</span>
          </button>

          <button
            type="button"
            onClick={toggleLocalWebcam}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors ${
              useLocalWebcam
                ? "border-[#059669] bg-[#ECFDF5] text-[#059669]"
                : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{useLocalWebcam ? "切回RTSP流" : "调用本地摄像头"}</span>
          </button>

          {!useLocalWebcam && (
            <button
              type="button"
              onClick={handleSnapshot}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>抓拍截图</span>
            </button>
          )}
        </div>

        {webcamError && (
          <p className="text-[11.5px] text-amber-700">{webcamError}</p>
        )}
      </div>
    </div>
  );
}

interface GatewayDeviceManagementProps {
  devices: GatewayDeviceItem[];
  initialProtocolFilter?: string;
  accountName?: string;
  orgName?: string;
  onAddDevices: (items: GatewayDeviceItem[]) => void;
  onUpdateDevices: (
    updater: (prev: GatewayDeviceItem[]) => GatewayDeviceItem[]
  ) => void;
  onOpenAiImport: () => void;
}

export function GatewayDeviceManagement({
  devices,
  initialProtocolFilter = "all",
  accountName,
  orgName,
  onAddDevices,
  onUpdateDevices,
  onOpenAiImport,
}: GatewayDeviceManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [protocolFilter, setProtocolFilter] = useState<string>(initialProtocolFilter);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<
    "all" | "collecting" | "stopped"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [sortAsc, setSortAsc] = useState(true);

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Create / Edit device modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDeviceId, setFormDeviceId] = useState("");
  const [formName, setFormName] = useState("");
  const [formModel, setFormModel] = useState("USR-M100");
  const [formCategory, setFormCategory] = useState<GatewayDeviceCategory>("modbus");
  const [formModbusType, setFormModbusType] = useState<ModbusSubType>("sensor");
  const [formProtocol, setFormProtocol] = useState("modbus_tcp");
  const [formAddress, setFormAddress] = useState("192.168.1.55:502 · 站号 1");
  const [formInterval, setFormInterval] = useState(5);
  const [formTags, setFormTags] = useState("Modbus, 实训室");
  const [formRtsp, setFormRtsp] = useState(
    "rtsp://192.168.1.70:554/Streaming/Channels/101"
  );

  // Virtual simulation import modal
  const [simModalOpen, setSimModalOpen] = useState(false);

  // Discover devices modal
  const [discoverModalOpen, setDiscoverModalOpen] = useState(false);
  const [discoverScanning, setDiscoverScanning] = useState(false);
  const [discoveredLanDevices, setDiscoveredLanDevices] = useState<
    GatewayDeviceItem[]
  >([]);

  // Config compare modal
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");

  useEffect(() => {
    setProtocolFilter(initialProtocolFilter || "all");
  }, [initialProtocolFilter]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    devices.forEach((d) => d.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = devices.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (protocolFilter !== "all" && d.protocol !== protocolFilter) return false;
      if (tagFilter !== "all" && !d.tags.includes(tagFilter)) return false;
      if (collectionFilter === "collecting" && !d.collecting) return false;
      if (collectionFilter === "stopped" && d.collecting) return false;
      if (!q) return true;
      return (
        d.deviceId.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.protocol.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) =>
      sortAsc
        ? a.deviceId.localeCompare(b.deviceId)
        : b.deviceId.localeCompare(a.deviceId)
    );
  }, [
    devices,
    search,
    statusFilter,
    protocolFilter,
    tagFilter,
    collectionFilter,
    sortAsc,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDevices = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, safePage, pageSize]);

  const selectedCount = Object.values(selectedRowIds).filter(Boolean).length;

  const notify = (msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3200);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormDeviceId(`dev-${Date.now().toString().slice(-6)}`);
    setFormName("");
    setFormModel("USR-M100");
    setFormCategory("modbus");
    setFormModbusType("sensor");
    setFormProtocol("modbus_tcp");
    setFormAddress("192.168.1.55:502 · 站号 1");
    setFormInterval(5);
    setFormTags("Modbus, 实训室");
    setFormModalOpen(true);
  };

  const openEditModal = (item: GatewayDeviceItem) => {
    setEditingId(item.id);
    setFormDeviceId(item.deviceId);
    setFormName(item.name);
    setFormModel(item.model);
    setFormCategory(item.category);
    setFormModbusType(item.modbusType ?? "sensor");
    setFormProtocol(item.protocol);
    setFormAddress(item.address);
    setFormInterval(item.collectInterval);
    setFormTags(item.tags.join(", "));
    setFormRtsp(
      item.rtspUrl || "rtsp://192.168.1.70:554/Streaming/Channels/101"
    );
    setFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDeviceId.trim()) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const parsedTags = formTags
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingId) {
      onUpdateDevices((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? {
                ...d,
                deviceId: formDeviceId.trim(),
                name: formName.trim(),
                model: formModel.trim() || d.model,
                category: formCategory,
                modbusType:
                  formCategory === "camera" ? undefined : formModbusType,
                protocol: formProtocol,
                address: formAddress.trim(),
                collectInterval: Number(formInterval) || 5,
                tags: parsedTags,
                rtspUrl: formCategory === "camera" ? formRtsp.trim() : d.rtspUrl,
                lastUpdate: now,
              }
            : d
        )
      );
      notify(`已保存设备「${formName.trim()}」的配置更改`);
      setFormModalOpen(false);
      return;
    }

    const created: GatewayDeviceItem =
      formCategory === "camera"
        ? {
            id: `cam-${Date.now()}`,
            deviceId: formDeviceId.trim(),
            name: formName.trim(),
            model: formModel.trim() || "IPC-1080P",
            category: "camera",
            protocol: formProtocol || "rtsp_onvif",
            address: formAddress.trim() || "192.168.1.70:554",
            status: "online",
            collecting: true,
            collectInterval: Number(formInterval) || 1,
            tags: parsedTags.length > 0 ? parsedTags : ["视觉监控"],
            lastUpdate: now,
            sourceMethod: "manual",
            rtspUrl: formRtsp.trim(),
            resolution: "1920×1080",
            fps: 25,
            sceneLabel: "手动接入摄像头实时视频通道",
          }
        : formModbusType === "relay"
          ? {
              id: `mb-relay-${Date.now()}`,
              deviceId: formDeviceId.trim(),
              name: formName.trim(),
              model: formModel.trim() || "USR-IO424T",
              category: "modbus",
              modbusType: "relay",
              protocol: formProtocol,
              address: formAddress.trim(),
              status: "online",
              collecting: true,
              collectInterval: Number(formInterval) || 5,
              tags: parsedTags.length > 0 ? parsedTags : ["控制执行"],
              lastUpdate: now,
              sourceMethod: "manual",
              relayChannels: [
                { channel: "DO1", label: "回路 1", isOn: false },
                { channel: "DO2", label: "回路 2", isOn: false },
                { channel: "DO3", label: "回路 3", isOn: false },
                { channel: "DO4", label: "回路 4", isOn: false },
              ],
            }
          : {
              id: `mb-sensor-${Date.now()}`,
              deviceId: formDeviceId.trim(),
              name: formName.trim(),
              model: formModel.trim() || "HT-485-M",
              category: formCategory,
              modbusType: "sensor",
              protocol: formProtocol,
              address: formAddress.trim(),
              status: "online",
              collecting: true,
              collectInterval: Number(formInterval) || 5,
              tags: parsedTags.length > 0 ? parsedTags : ["传感器"],
              lastUpdate: now,
              sourceMethod: "manual",
              sensorMetrics: [
                { key: "temperature", label: "temperature (°C)", value: 25.1, unit: "℃", register: "0x0001" },
                { key: "humidity", label: "humidity (%RH)", value: 54.0, unit: "%RH", register: "0x0000" },
              ],
            };

    onAddDevices([created]);
    notify(`已创建并接入设备「${created.name}」`);
    setFormModalOpen(false);
  };

  const handleCreateSimulator = () => {
    const idx =
      devices.filter((d) => d.protocol === "simulator").length + 1;
    const padded = String(idx).padStart(2, "0");
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const simDevice: GatewayDeviceItem = {
      id: `sim-dev-${Date.now()}`,
      deviceId: `sim-env-${padded}`,
      name: `环境综合传感器模拟 #${padded}`,
      model: "SIM-ENV-PRO",
      category: "simulator",
      modbusType: "sensor",
      protocol: "simulator",
      address: `127.0.0.1:${5020 + idx} · 内部仿真通道`,
      status: "online",
      collecting: true,
      collectInterval: 5,
      tags: ["仿真", "自动生成"],
      lastUpdate: now,
      sourceMethod: "simulation",
      sensorMetrics: [
        { key: "temperature", label: "temperature (°C)", value: 24.8, unit: "℃", register: "0x0001" },
        { key: "humidity", label: "humidity (%RH)", value: 58.2, unit: "%RH", register: "0x0000" },
      ],
    };
    onAddDevices([simDevice]);
    notify(`已创建模拟器设备「${simDevice.deviceId}」并启动采集`);
  };

  const handleToggleCollection = (item: GatewayDeviceItem) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const nextCollecting = !item.collecting;
    onUpdateDevices((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              collecting: nextCollecting,
              status: nextCollecting ? "online" : d.status,
              fanRunning: d.category === "fan" ? nextCollecting : d.fanRunning,
              lightOn: d.category === "light" ? nextCollecting : d.lightOn,
              lastUpdate: now,
            }
          : d
      )
    );
    notify(
      nextCollecting
        ? `设备「${item.name}」已开始周期采集 (${item.collectInterval}s)`
        : `设备「${item.name}」已停止采集`
    );
  };

  const handleClone = (item: GatewayDeviceItem) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const cloned: GatewayDeviceItem = {
      ...item,
      id: `${item.id}-clone-${Date.now()}`,
      deviceId: `${item.deviceId}-copy`,
      name: `${item.name} (副本)`,
      collecting: false,
      lastUpdate: now,
    };
    onAddDevices([cloned]);
    notify(`已克隆设备配置「${cloned.deviceId}」`);
  };

  const handleDelete = (item: GatewayDeviceItem) => {
    onUpdateDevices((prev) => prev.filter((d) => d.id !== item.id));
    setSelectedRowIds((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    notify(`已删除设备「${item.name}」`);
  };

  const handleToggleRelayChannel = (deviceId: string, channelName: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId || !d.relayChannels) return d;
        return {
          ...d,
          lastUpdate: now,
          relayChannels: d.relayChannels.map((ch) =>
            ch.channel === channelName ? { ...ch, isOn: !ch.isOn } : ch
          ),
        };
      })
    );
  };

  const handleRefreshSensor = (deviceId: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId || !d.sensorMetrics) return d;
        return {
          ...d,
          status: "online",
          lastUpdate: now,
          sensorMetrics: d.sensorMetrics.map((m) => ({
            ...m,
            value: Number(
              (m.value + (Math.random() - 0.5) * 0.6).toFixed(2)
            ),
          })),
        };
      })
    );
  };

  const handleScanLanDevices = () => {
    setDiscoverModalOpen(true);
    setDiscoverScanning(true);
    setDiscoveredLanDevices([]);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      const stamp = Date.now().toString().slice(-3);
      setDiscoveredLanDevices([
        {
          id: `disc-plc-${Date.now()}-1`,
          deviceId: `plc-s7-1200-${stamp}`,
          name: "西门子 S7-1200 产线主控 PLC",
          model: "CPU 1214C DC/DC/DC",
          category: "plc",
          protocol: "siemens_s7",
          address: "192.168.1.20:102 · Rack 0 Slot 1",
          status: "online",
          collecting: true,
          collectInterval: 2,
          tags: ["自动发现", "PLC"],
          lastUpdate: now,
          sourceMethod: "discover",
          sensorMetrics: [
            { key: "cycle_time", label: "cycle_time (ms)", value: 14.2, unit: "ms", register: "DB1.DBD0" },
          ],
        },
        {
          id: `disc-mb-${Date.now()}-2`,
          deviceId: `meter-485-${stamp}`,
          name: "三相智能电力监测仪表",
          model: "DTSD1352-C",
          category: "modbus",
          modbusType: "sensor",
          protocol: "modbus_tcp",
          address: "192.168.1.33:502 · 站号 3",
          status: "online",
          collecting: true,
          collectInterval: 5,
          tags: ["自动发现", "能耗"],
          lastUpdate: now,
          sourceMethod: "discover",
          sensorMetrics: [
            { key: "voltage", label: "voltage (V)", value: 221.4, unit: "V", register: "0x0061" },
            { key: "power", label: "active_power (kW)", value: 3.82, unit: "kW", register: "0x016A" },
          ],
        },
      ]);
      setDiscoverScanning(false);
    }, 850);
  };

  const handleOpenCompare = () => {
    const checked = devices.filter((d) => selectedRowIds[d.id]);
    setCompareLeftId(checked[0]?.id ?? devices[0]?.id ?? "");
    setCompareRightId(checked[1]?.id ?? devices[1]?.id ?? devices[0]?.id ?? "");
    setCompareModalOpen(true);
  };

  const compareLeft = devices.find((d) => d.id === compareLeftId);
  const compareRight = devices.find((d) => d.id === compareRightId);

  return (
    <div className="flex-1 flex flex-col justify-between gap-4 pb-14">
      <div className="space-y-3">
        {/* Top Filter Bar matching Screenshot 1 */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48 sm:w-52">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="搜索设备名称/ID"
                  className="w-full rounded-md border border-[#E5E7EB] bg-white focus:border-[#10B981] focus:outline-none pl-8 pr-6 py-1.5 text-[12.5px] text-[#111827] placeholder:text-[#9CA3AF]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                aria-label="状态筛选"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "all" | "online" | "offline");
                  setCurrentPage(1);
                }}
                className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12.5px] text-[#4B5563] focus:border-[#10B981] focus:outline-none cursor-pointer"
              >
                <option value="all">状态筛选</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
              </select>

              <select
                aria-label="协议筛选"
                value={protocolFilter}
                onChange={(e) => {
                  setProtocolFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12.5px] text-[#4B5563] focus:border-[#10B981] focus:outline-none cursor-pointer"
              >
                <option value="all">协议筛选</option>
                {SUPPORTED_PROTOCOLS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} ({p.label})
                  </option>
                ))}
              </select>

              <select
                aria-label="标签筛选"
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12.5px] text-[#4B5563] focus:border-[#10B981] focus:outline-none cursor-pointer"
              >
                <option value="all">标签筛选</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Segmented State: 全部 / 采集中 / 已停止 */}
              <div className="inline-flex items-center rounded-md border border-[#E5E7EB] overflow-hidden text-[12.5px]">
                {[
                  { key: "all" as const, label: "全部" },
                  { key: "collecting" as const, label: "采集中" },
                  { key: "stopped" as const, label: "已停止" },
                ].map((tab, idx) => {
                  const active = collectionFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setCollectionFilter(tab.key);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        idx > 0 ? "border-l border-[#E5E7EB]" : ""
                      } ${
                        active
                          ? "bg-[#16A34A] text-white"
                          : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* WebSocket 已连接 live status */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[12px] font-medium text-[#059669] whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>WebSocket 已连接</span>
              </span>
            </div>

            {/* Right View Toggle: 表格视图 / 卡片视图 */}
            <div className="inline-flex items-center rounded-md border border-[#E5E7EB] overflow-hidden text-[12.5px] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  viewMode === "table"
                    ? "bg-[#16A34A] text-white"
                    : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>表格视图</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-medium border-l border-[#E5E7EB] cursor-pointer transition-colors whitespace-nowrap ${
                  viewMode === "card"
                    ? "bg-[#16A34A] text-white"
                    : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>卡片视图</span>
              </button>
            </div>
          </div>

          {/* Second Row Action Buttons: 3 ways to add devices (手动 / AI导入 / 虚拟仿真导入) + utilities */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F3F4F6]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>手动添加</span>
              </button>

              <button
                type="button"
                onClick={onOpenAiImport}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#C7D2FE] bg-[#EEF2FF]/70 hover:bg-[#E0E7FF] px-3 py-1.5 text-[12.5px] font-medium text-[#4338CA] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI 导入</span>
              </button>

              <button
                type="button"
                onClick={() => setSimModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF]/70 hover:bg-[#DBEAFE] px-3 py-1.5 text-[12.5px] font-medium text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Box className="w-3.5 h-3.5" />
                <span>虚拟仿真导入</span>
              </button>

              <span className="hidden sm:inline-block h-4 w-px bg-[#E5E7EB] mx-0.5" />

              <button
                type="button"
                onClick={handleCreateSimulator}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 text-[12.5px] font-medium text-[#374151] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>创建模拟器</span>
              </button>

              <button
                type="button"
                onClick={handleScanLanDevices}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 text-[12.5px] font-medium text-[#374151] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Radar className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>发现设备</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCompare}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 text-[12.5px] font-medium text-[#374151] transition-colors cursor-pointer whitespace-nowrap"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>配置对比</span>
              </button>
            </div>

            {selectedCount > 0 && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#4B5563]">
                  已选 <strong className="font-mono-tabular">{selectedCount}</strong> 项
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDevices((prev) =>
                      prev.map((d) =>
                        selectedRowIds[d.id]
                          ? { ...d, collecting: true, status: "online" }
                          : d
                      )
                    );
                    notify(`已批量启动 ${selectedCount} 台设备采集`);
                  }}
                  className="rounded border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[#059669] font-medium cursor-pointer"
                >
                  批量采集
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDevices((prev) =>
                      prev.filter((d) => !selectedRowIds[d.id])
                    );
                    setSelectedRowIds({});
                    notify(`已批量删除 ${selectedCount} 台设备`);
                  }}
                  className="rounded border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[#DC2626] font-medium cursor-pointer"
                >
                  批量删除
                </button>
              </div>
            )}
          </div>
        </div>

        {bannerMsg && (
          <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46] flex items-center justify-between">
            <span>{bannerMsg}</span>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              className="text-[12px] hover:underline cursor-pointer"
            >
              关闭
            </button>
          </div>
        )}

        {/* Main Content: Table View vs Card View */}
        {viewMode === "table" ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            {paginatedDevices.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <p className="text-[14px] font-semibold text-[#111827]">
                  未找到匹配的接入设备
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setProtocolFilter("all");
                    setTagFilter("all");
                    setCollectionFilter("all");
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#16A34A] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置筛选条件</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[12.5px] font-semibold text-[#374151]">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          aria-label="全选本页设备"
                          checked={
                            paginatedDevices.length > 0 &&
                            paginatedDevices.every((d) => selectedRowIds[d.id])
                          }
                          onChange={(e) => {
                            const next = { ...selectedRowIds };
                            paginatedDevices.forEach((d) => {
                              next[d.id] = e.target.checked;
                            });
                            setSelectedRowIds(next);
                          }}
                          className="w-3.5 h-3.5 accent-[#16A34A] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSortAsc((v) => !v)}
                          className="inline-flex items-center gap-1.5 hover:text-[#111827] cursor-pointer"
                        >
                          <span>设备ID</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        </button>
                      </th>
                      <th className="py-3 px-4 whitespace-nowrap">名称</th>
                      <th className="py-3 px-4 whitespace-nowrap">协议</th>
                      <th className="py-3 px-4 whitespace-nowrap">状态</th>
                      <th className="py-3 px-4 whitespace-nowrap">采集间隔</th>
                      <th className="py-3 px-4 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6] text-[13px]">
                    {paginatedDevices.map((item) => {
                      const isExpanded = Boolean(expandedIds[item.id]);
                      return (
                        <Fragment key={item.id}>
                          <tr className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                aria-label={`选择设备 ${item.name}`}
                                checked={Boolean(selectedRowIds[item.id])}
                                onChange={(e) =>
                                  setSelectedRowIds((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.checked,
                                  }))
                                }
                                className="w-3.5 h-3.5 accent-[#16A34A] cursor-pointer"
                              />
                            </td>

                            <td className="py-3 px-4 font-mono-tabular text-[#374151] whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedIds((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }))
                                }
                                className="inline-flex items-center gap-1.5 hover:text-[#059669] cursor-pointer"
                                title="点击展开实时测点/通道控制"
                              >
                                <ChevronRight
                                  className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${
                                    isExpanded ? "rotate-90 text-[#059669]" : ""
                                  }`}
                                />
                                <span>{item.deviceId}</span>
                              </button>
                            </td>

                            <td className="py-3 px-4 font-medium text-[#111827] whitespace-nowrap">
                              {item.name}
                            </td>

                            <td className="py-3 px-4 font-mono-tabular text-[#4B5563] whitespace-nowrap">
                              {item.protocol}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {item.status === "online" ? (
                                <span className="inline-block rounded border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11.5px] font-medium text-[#16A34A]">
                                  在线
                                </span>
                              ) : (
                                <span className="inline-block rounded border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 text-[11.5px] font-medium text-[#EF4444]">
                                  离线
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 font-mono-tabular text-[#374151]">
                              {item.collectInterval}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-3 text-[12.5px] font-medium">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  className="text-[#16A34A] hover:underline cursor-pointer"
                                >
                                  编辑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleCollection(item)}
                                  className={`cursor-pointer hover:underline ${
                                    item.collecting
                                      ? "text-[#D97706]"
                                      : "text-[#16A34A]"
                                  }`}
                                >
                                  {item.collecting ? "停止采集" : "开始采集"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleClone(item)}
                                  className="text-[#2563EB] hover:underline cursor-pointer"
                                >
                                  克隆
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item)}
                                  className="text-[#EF4444] hover:underline cursor-pointer"
                                >
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Live Telemetry / Relay Control / Camera Feed */}
                          {isExpanded && (
                            <tr className="bg-[#FAFBFD]">
                              <td
                                colSpan={7}
                                className="px-8 py-4 border-t border-[#E5E7EB]"
                              >
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6B7280]">
                                  <span>
                                    型号：<strong className="text-[#111827]">{item.model}</strong> · 地址：
                                    <span className="font-mono-tabular text-[#374151]">
                                      {item.address}
                                    </span>
                                  </span>
                                  <span className="font-mono-tabular">
                                    最近更新：{item.lastUpdate}
                                  </span>
                                </div>

                                {item.category === "camera" ? (
                                  <InlineCameraFeed device={item} />
                                ) : item.category === "fan" ? (
                                  <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 flex items-center justify-between">
                                    <div>
                                      <div className="text-[13px] font-semibold text-[#111827]">
                                        排风风扇运行控制
                                      </div>
                                      <div className="text-[11.5px] text-[#6B7280] mt-0.5">
                                        当前状态：{item.status === "online" && (item.fanRunning ?? item.collecting) ? "开启运转中" : "已停止"}（与数字孪生及实时监控同步）
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={item.status === "online" && Boolean(item.fanRunning ?? item.collecting)}
                                      onClick={() => handleToggleCollection(item)}
                                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold cursor-pointer ${
                                        item.status === "online" && (item.fanRunning ?? item.collecting)
                                          ? "border-[#16A34A] bg-[#ECFDF5] text-[#16A34A]"
                                          : "border-[#D1D5DB] bg-[#F9FAFB] text-[#4B5563]"
                                      }`}
                                    >
                                      <span>
                                        {item.status === "online" && (item.fanRunning ?? item.collecting)
                                          ? "开启"
                                          : "关闭"}
                                      </span>
                                    </button>
                                  </div>
                                ) : item.category === "light" ? (
                                  <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 flex items-center justify-between">
                                    <div>
                                      <div className="text-[13px] font-semibold text-[#111827]">
                                        智能照明灯泡控制
                                      </div>
                                      <div className="text-[11.5px] text-[#6B7280] mt-0.5">
                                        当前状态：{item.status === "online" && (item.lightOn ?? item.collecting) ? "已点亮" : "已关闭"}（与数字孪生及实时监控同步）
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={item.status === "online" && Boolean(item.lightOn ?? item.collecting)}
                                      onClick={() => handleToggleCollection(item)}
                                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-semibold cursor-pointer ${
                                        item.status === "online" && (item.lightOn ?? item.collecting)
                                          ? "border-[#EAB308] bg-[#FEF9C3] text-[#A16207]"
                                          : "border-[#D1D5DB] bg-[#F9FAFB] text-[#4B5563]"
                                      }`}
                                    >
                                      <span>
                                        {item.status === "online" && (item.lightOn ?? item.collecting)
                                          ? "开启"
                                          : "关闭"}
                                      </span>
                                    </button>
                                  </div>
                                ) : item.modbusType === "relay" && item.relayChannels ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {item.relayChannels.map((ch) => (
                                      <div
                                        key={ch.channel}
                                        className="rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 flex items-center justify-between"
                                      >
                                        <div>
                                          <div className="text-[11px] font-mono-tabular text-[#6B7280]">
                                            {ch.channel}
                                          </div>
                                          <div className="text-[13px] font-medium text-[#111827]">
                                            {ch.label}
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleRelayChannel(item.id, ch.channel)
                                          }
                                          className={`px-3 py-1 rounded-md text-[11.5px] font-semibold cursor-pointer transition-colors ${
                                            ch.isOn
                                              ? "bg-[#16A34A] text-white"
                                              : "bg-[#F3F4F6] text-[#4B5563] hover:bg-[#E5E7EB]"
                                          }`}
                                        >
                                          {ch.isOn ? "ON" : "OFF"}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[12.5px] font-semibold text-[#111827]">
                                        实时测点读数
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRefreshSensor(item.id)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-2.5 py-1 text-[11.5px] font-medium text-[#059669] cursor-pointer"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>刷新采样</span>
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      {item.sensorMetrics?.map((m) => (
                                        <div
                                          key={m.label}
                                          className="rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 flex items-center justify-between"
                                        >
                                          <div>
                                            <div className="text-[12px] text-[#4B5563]">
                                              {m.label}
                                            </div>
                                            <div className="text-[11px] font-mono-tabular text-[#9CA3AF]">
                                              寄存器 {m.register}
                                            </div>
                                          </div>
                                          <div className="text-[18px] font-bold text-[#111827] font-mono-tabular">
                                            {m.value}
                                            <span className="ml-1 text-[11.5px] font-normal text-[#6B7280]">
                                              {m.unit}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedDevices.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-bold text-[#111827]">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-[11.5px] font-mono-tabular text-[#6B7280]">
                        {item.deviceId} · {item.protocol}
                      </div>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                        item.status === "online"
                          ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                          : "border-[#FECACA] bg-[#FEF2F2] text-[#EF4444]"
                      }`}
                    >
                      {item.status === "online" ? "在线" : "离线"}
                    </span>
                  </div>

                  <div className="mt-2.5 text-[12px] text-[#4B5563] font-mono-tabular">
                    {item.address} · 间隔 {item.collectInterval}s
                  </div>

                  {item.sensorMetrics && item.sensorMetrics.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {item.sensorMetrics.slice(0, 2).map((m) => (
                        <div
                          key={m.label}
                          className="rounded-lg bg-[#F9FAFB] border border-[#F3F4F6] px-2.5 py-1.5"
                        >
                          <div className="text-[11px] text-[#6B7280] truncate">
                            {m.label}
                          </div>
                          <div className="text-[15px] font-bold text-[#111827] font-mono-tabular">
                            {m.value} {m.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.relayChannels && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.relayChannels.map((ch) => (
                        <button
                          key={ch.channel}
                          type="button"
                          onClick={() =>
                            handleToggleRelayChannel(item.id, ch.channel)
                          }
                          className={`rounded px-2 py-1 text-[11px] font-mono-tabular font-medium cursor-pointer ${
                            ch.isOn
                              ? "bg-[#16A34A] text-white"
                              : "bg-[#F3F4F6] text-[#4B5563]"
                          }`}
                        >
                          {ch.channel}: {ch.isOn ? "ON" : "OFF"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] font-medium">
                  <button
                    type="button"
                    onClick={() => handleToggleCollection(item)}
                    className={`inline-flex items-center gap-1 cursor-pointer ${
                      item.collecting ? "text-[#D97706]" : "text-[#16A34A]"
                    }`}
                  >
                    {item.collecting ? (
                      <>
                        <Square className="w-3 h-3" />
                        <span>停止采集</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>开始采集</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-[#16A34A] hover:underline cursor-pointer"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClone(item)}
                      className="text-[#2563EB] hover:underline cursor-pointer"
                    >
                      克隆
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="text-[#EF4444] hover:underline cursor-pointer"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Right Pagination matching Screenshot 1 */}
      <div className="flex items-center justify-end gap-2 pt-2 text-[12.5px]">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="h-8 w-8 rounded border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 flex items-center justify-center text-[#6B7280] cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={`h-8 min-w-8 px-2.5 rounded border font-mono-tabular font-medium cursor-pointer ${
              page === safePage
                ? "border-[#16A34A] text-[#16A34A] bg-white"
                : "border-[#E5E7EB] text-[#4B5563] bg-white hover:bg-[#F9FAFB]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="h-8 w-8 rounded border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] disabled:opacity-40 flex items-center justify-center text-[#6B7280] cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <select
          aria-label="每页显示条数"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="h-8 rounded border border-[#E5E7EB] bg-white px-2.5 text-[12.5px] text-[#374151] focus:border-[#16A34A] focus:outline-none cursor-pointer"
        >
          <option value={10}>10 / 页</option>
          <option value={20}>20 / 页</option>
          <option value={50}>50 / 页</option>
        </select>
      </div>

      {/* Create / Edit Modal */}
      {formModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[15px] font-bold text-[#111827]">
                {editingId ? "编辑设备配置" : "创建新接入设备"}
              </h3>
              <button
                type="button"
                onClick={() => setFormModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    设备 ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formDeviceId}
                    onChange={(e) => setFormDeviceId(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    设备名称
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="如：一号车间温湿度节点"
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 focus:border-[#16A34A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    设备类别
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const cat = e.target.value as GatewayDeviceCategory;
                      setFormCategory(cat);
                      if (cat === "camera") setFormProtocol("rtsp_onvif");
                      else if (cat === "simulator") setFormProtocol("simulator");
                      else setFormProtocol("modbus_tcp");
                    }}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 focus:border-[#16A34A] focus:outline-none"
                  >
                    <option value="modbus">Modbus 设备</option>
                    <option value="fan">智能排风风扇</option>
                    <option value="light">智能照明灯泡</option>
                    <option value="gateway">边缘网关设备</option>
                    <option value="camera">工业视觉摄像头</option>
                    <option value="simulator">内置数据模拟器</option>
                    <option value="plc">工业 PLC 控制器</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    通讯协议
                  </label>
                  <select
                    value={formProtocol}
                    onChange={(e) => setFormProtocol(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                  >
                    {SUPPORTED_PROTOCOLS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} ({p.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formCategory === "modbus" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-[#374151] mb-1">
                      Modbus 功能子型
                    </label>
                    <select
                      value={formModbusType}
                      onChange={(e) =>
                        setFormModbusType(e.target.value as ModbusSubType)
                      }
                      className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 focus:border-[#16A34A] focus:outline-none"
                    >
                      <option value="sensor">传感器 (只读采集)</option>
                      <option value="relay">继电器 (DO开关控制)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#374151] mb-1">
                      采集间隔 (秒)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      value={formInterval}
                      onChange={(e) => setFormInterval(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    连接地址 / 串口参数
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 focus:border-[#16A34A] focus:outline-none"
                  />
                </div>
              </div>

              {formCategory === "camera" && (
                <div>
                  <label className="block font-medium text-[#374151] mb-1">
                    RTSP 拉流地址
                  </label>
                  <input
                    type="text"
                    value={formRtsp}
                    onChange={(e) => setFormRtsp(e.target.value)}
                    className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#F3F4F6] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="rounded-lg border border-[#D1D5DB] px-4 py-1.5 text-[12.5px] font-medium text-[#374151] hover:bg-[#F9FAFB] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
                >
                  {editingId ? "保存修改" : "确认创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discover Devices Modal */}
      {discoverModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <div>
                <h3 className="text-[15px] font-bold text-[#111827]">
                  南向总线与局域网设备发现
                </h3>
                <p className="text-[12px] text-[#6B7280]">
                  自动扫描工业网段 (192.168.1.0/24) 与 RS485 串口设备
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDiscoverModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {discoverScanning ? (
                <div className="py-10 flex flex-col items-center gap-2.5 text-[#059669]">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span className="text-[13px] font-medium">
                    正在发送 Modbus TCP / ONVIF / S7 探测广播...
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {discoveredLanDevices.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-xl border border-[#E5E7EB] p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-[#111827]">
                          {d.name}
                        </div>
                        <div className="text-[11.5px] font-mono-tabular text-[#6B7280]">
                          {d.deviceId} · {d.protocol} · {d.address}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onAddDevices([d]);
                          setDiscoveredLanDevices((prev) =>
                            prev.filter((x) => x.id !== d.id)
                          );
                          notify(`已接入发现的设备「${d.name}」`);
                        }}
                        className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer shrink-0"
                      >
                        一键接入
                      </button>
                    </div>
                  ))}
                  {discoveredLanDevices.length === 0 && (
                    <p className="py-6 text-center text-[13px] text-[#6B7280]">
                      本次发现的设备已全部接入完成。
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Config Compare Modal */}
      {compareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[15px] font-bold text-[#111827]">
                设备配置对比
              </h3>
              <button
                type="button"
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[12.5px]">
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={compareLeftId}
                  onChange={(e) => setCompareLeftId(e.target.value)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.deviceId})
                    </option>
                  ))}
                </select>
                <select
                  value={compareRightId}
                  onChange={(e) => setCompareRightId(e.target.value)}
                  className="rounded-lg border border-[#D1D5DB] bg-white px-3 py-2"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.deviceId})
                    </option>
                  ))}
                </select>
              </div>

              {compareLeft && compareRight && (
                <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563]">
                        <th className="py-2.5 px-4 w-32">配置项</th>
                        <th className="py-2.5 px-4">{compareLeft.name}</th>
                        <th className="py-2.5 px-4">{compareRight.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6] font-mono-tabular">
                      {[
                        ["设备ID", compareLeft.deviceId, compareRight.deviceId],
                        ["型号", compareLeft.model, compareRight.model],
                        ["协议", compareLeft.protocol, compareRight.protocol],
                        ["通信地址", compareLeft.address, compareRight.address],
                        [
                          "采集间隔",
                          `${compareLeft.collectInterval}s`,
                          `${compareRight.collectInterval}s`,
                        ],
                        [
                          "在线状态",
                          compareLeft.status === "online" ? "在线" : "离线",
                          compareRight.status === "online" ? "在线" : "离线",
                        ],
                      ].map(([field, leftVal, rightVal]) => {
                        const diff = leftVal !== rightVal;
                        return (
                          <tr key={field} className={diff ? "bg-amber-50/40" : ""}>
                            <td className="py-2.5 px-4 font-sans font-medium text-[#4B5563]">
                              {field}
                            </td>
                            <td className="py-2.5 px-4 text-[#111827]">
                              {leftVal}
                            </td>
                            <td className="py-2.5 px-4 text-[#111827]">
                              {rightVal}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Virtual Simulation & N2V File Import Modal */}
      <SimulationImportModal
        open={simModalOpen}
        accountName={accountName}
        orgName={orgName}
        onClose={() => setSimModalOpen(false)}
        onConfirmImport={(imported) => {
          const normalized = imported.map((d, idx) => ({
            ...d,
            deviceId:
              d.deviceId ||
              `sim-${Date.now().toString().slice(-4)}-${idx + 1}`,
            collecting: d.collecting ?? true,
            collectInterval: d.collectInterval ?? 5,
            tags: d.tags ?? ["虚拟仿真"],
          }));
          onAddDevices(normalized);
          notify(`已成功导入 ${normalized.length} 台虚拟仿真设备`);
        }}
      />
    </div>
  );
}
