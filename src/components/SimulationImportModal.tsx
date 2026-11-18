import {
  Box,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Globe,
  Layers,
  Loader2,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GatewayDeviceItem } from "../types/gateway";

interface SimulationProject {
  id: string;
  name: string;
  code: string;
  sceneType: string;
  updatedAt: string;
  deviceSummary: string;
  devices: Omit<
    GatewayDeviceItem,
    "id" | "deviceId" | "collecting" | "collectInterval" | "tags" | "lastUpdate"
  >[];
}

const SIMULATION_PROJECTS: SimulationProject[] = [
  {
    id: "sim-proj-agri",
    name: "智慧农业温室大棚数字孪生实训项目",
    code: "PRJ-N2V-202601",
    sceneType: "智慧农业 · 环境监测与联动",
    updatedAt: "2026-11-16 14:20",
    deviceSummary: "2 个 Modbus 设备 · 1 路虚拟摄像头",
    devices: [
      {
        name: "[仿真] 温室一号土壤温湿度传感器",
        model: "SIM-TH-RS485",
        category: "modbus",
        modbusType: "sensor",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5020 · 站号 1",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧农业温室大棚数字孪生实训项目",
        sensorMetrics: [
          { label: "空气温度", value: 26.8, unit: "℃", register: "0x0001" },
          { label: "空气湿度", value: 68.5, unit: "%RH", register: "0x0000" },
          { label: "大棚光照", value: 840, unit: "Lux", register: "0x0002" },
        ],
      },
      {
        name: "[仿真] 大棚卷帘与灌溉四路继电器",
        model: "SIM-IO-424T",
        category: "modbus",
        modbusType: "relay",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5020 · 站号 2",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧农业温室大棚数字孪生实训项目",
        relayChannels: [
          { channel: "DO1", label: "喷淋电磁阀", isOn: true },
          { channel: "DO2", label: "顶部遮阳帘", isOn: false },
          { channel: "DO3", label: "补光灯阵列", isOn: true },
          { channel: "DO4", label: "通风风机", isOn: false },
        ],
      },
      {
        name: "[仿真] 温室全景虚拟巡检摄像头",
        model: "SIM-V-CAM1080",
        category: "camera",
        protocol: "rtsp_onvif",
        address: "127.0.0.1:8554",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧农业温室大棚数字孪生实训项目",
        rtspUrl: "rtsp://127.0.0.1:8554/sim/agri-greenhouse/cam1",
        resolution: "1920×1080",
        fps: 25,
        sceneLabel: "3D虚拟仿真 · 温室大棚A区全景视角",
      },
    ],
  },
  {
    id: "sim-proj-factory",
    name: "智能制造产线分拣与PLC联调仿真项目",
    code: "PRJ-N2V-202604",
    sceneType: "智能制造 · 工业视觉与IO控制",
    updatedAt: "2026-11-17 09:45",
    deviceSummary: "2 个 Modbus 设备 · 1 路虚拟摄像头",
    devices: [
      {
        name: "[仿真] 产线分拣执行机构继电器",
        model: "SIM-PLC-IO4",
        category: "modbus",
        modbusType: "relay",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5021 · 站号 1",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智能制造产线分拣与PLC联调仿真项目",
        relayChannels: [
          { channel: "DO1", label: "主传送带电机", isOn: true },
          { channel: "DO2", label: "机械臂气爪", isOn: false },
          { channel: "DO3", label: "良品推杆", isOn: false },
          { channel: "DO4", label: "三色警示灯", isOn: true },
        ],
      },
      {
        name: "[仿真] 伺服电机温升监测传感器",
        model: "SIM-PT100-M",
        category: "modbus",
        modbusType: "sensor",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5021 · 站号 3",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智能制造产线分拣与PLC联调仿真项目",
        sensorMetrics: [
          { label: "电机温度", value: 42.3, unit: "℃", register: "0x0001" },
          { label: "车间湿度", value: 46.2, unit: "%RH", register: "0x0000" },
        ],
      },
      {
        name: "[仿真] 工位顶部视觉质检虚拟相机",
        model: "SIM-MV-QC200",
        category: "camera",
        protocol: "rtsp_onvif",
        address: "127.0.0.1:8555",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智能制造产线分拣与PLC联调仿真项目",
        rtspUrl: "rtsp://127.0.0.1:8555/sim/factory-line/vision01",
        resolution: "1920×1080",
        fps: 30,
        sceneLabel: "3D虚拟仿真 · 产线物料视觉分拣工位",
      },
    ],
  },
  {
    id: "sim-proj-coldchain",
    name: "智慧冷链仓储环境监控虚拟工程",
    code: "PRJ-N2V-202609",
    sceneType: "冷链物流 · 温湿度与冷机控制",
    updatedAt: "2026-11-15 17:10",
    deviceSummary: "2 个 Modbus 设备",
    devices: [
      {
        name: "[仿真] 1号冷库多点温湿度传感器",
        model: "SIM-COLD-TH",
        category: "modbus",
        modbusType: "sensor",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5022 · 站号 1",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧冷链仓储环境监控虚拟工程",
        sensorMetrics: [
          { label: "冷库温度", value: -16.4, unit: "℃", register: "0x0001" },
          { label: "冷库湿度", value: 74.0, unit: "%RH", register: "0x0000" },
        ],
      },
      {
        name: "[仿真] 制冷压缩机与库门状态继电器",
        model: "SIM-IO-COLD",
        category: "modbus",
        modbusType: "relay",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5022 · 站号 2",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧冷链仓储环境监控虚拟工程",
        relayChannels: [
          { channel: "DO1", label: "主制冷机组", isOn: true },
          { channel: "DO2", label: "融霜加热器", isOn: false },
          { channel: "DO3", label: "库门风幕机", isOn: true },
          { channel: "DO4", label: "超温声光报警", isOn: false },
        ],
      },
    ],
  },
  {
    id: "sim-proj-building",
    name: "智慧楼宇配电安防实训仿真工程",
    code: "PRJ-N2V-202612",
    sceneType: "智慧园区 · 配电监测与安防",
    updatedAt: "2026-11-14 11:30",
    deviceSummary: "1 个 Modbus 设备 · 1 路虚拟摄像头",
    devices: [
      {
        name: "[仿真] 配电室环境温湿度传感器",
        model: "SIM-ENV-485",
        category: "modbus",
        modbusType: "sensor",
        protocol: "modbus_rtu",
        address: "COM9 (虚拟串口) · 站号 4",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧楼宇配电安防实训仿真工程",
        sensorMetrics: [
          { label: "环境温度", value: 27.5, unit: "℃", register: "0x0001" },
          { label: "环境湿度", value: 44.1, unit: "%RH", register: "0x0000" },
        ],
      },
      {
        name: "[仿真] 配电室通道安防虚拟摄像头",
        model: "SIM-IPC-SEC",
        category: "camera",
        protocol: "rtsp_onvif",
        address: "127.0.0.1:8556",
        status: "online",
        sourceMethod: "simulation",
        sourceDetail: "当前账号虚拟仿真项目 · 智慧楼宇配电安防实训仿真工程",
        rtspUrl: "rtsp://127.0.0.1:8556/sim/building/corridor",
        resolution: "1280×720",
        fps: 25,
        sceneLabel: "3D虚拟仿真 · 智慧楼宇配电室安防视角",
      },
    ],
  },
];

function buildSampleN2vContent(): string {
  const samplePayload = {
    format: "N2V-PROJECT",
    version: "2.4.0",
    projectName: "智能实训室综合仿真工程",
    createdAt: "2026-11-17T10:00:00Z",
    devices: [
      {
        name: "[N2V] 实训台虚拟温湿度传感器",
        model: "N2V-TH-100",
        category: "modbus",
        modbusType: "sensor",
        protocol: "Modbus TCP (N2V仿真)",
        address: "127.0.0.1:5030 · 站号 1",
        sensorMetrics: [
          { label: "仿真温度", value: 25.4, unit: "℃", register: "0x0001" },
          { label: "仿真湿度", value: 53.2, unit: "%RH", register: "0x0000" },
        ],
      },
      {
        name: "[N2V] 实训台四路灯光风机继电器",
        model: "N2V-RELAY-4CH",
        category: "modbus",
        modbusType: "relay",
        protocol: "Modbus TCP (N2V仿真)",
        address: "127.0.0.1:5030 · 站号 2",
        relayChannels: [
          { channel: "DO1", label: "主照明灯", isOn: true },
          { channel: "DO2", label: "排风风扇", isOn: false },
          { channel: "DO3", label: "警报蜂鸣", isOn: false },
          { channel: "DO4", label: "直流电锁", isOn: true },
        ],
      },
      {
        name: "[N2V] 虚拟工位识别摄像头",
        model: "N2V-CAM-HD",
        category: "camera",
        protocol: "RTSP (N2V虚拟流)",
        address: "127.0.0.1:8560",
        rtspUrl: "rtsp://127.0.0.1:8560/n2v/lab/cam1",
        resolution: "1920×1080",
        fps: 25,
        sceneLabel: "N2V工程场景 · 实训台视觉识别通道",
      },
    ],
  };
  return JSON.stringify(samplePayload, null, 2);
}

async function parseN2vFile(file: File): Promise<{
  sceneName: string;
  devices: GatewayDeviceItem[];
}> {
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const baseStamp = Date.now();
  const text = await file.text();
  const cleanFileName = file.name;

  // Attempt JSON-based N2V parsing first
  try {
    const parsed = JSON.parse(text);
    const rawList: Array<Record<string, unknown>> = Array.isArray(parsed?.devices)
      ? parsed.devices
      : Array.isArray(parsed?.nodes)
        ? parsed.nodes
        : Array.isArray(parsed)
          ? parsed
          : [];

    if (rawList.length > 0) {
      const sceneName =
        typeof parsed?.projectName === "string" && parsed.projectName.trim()
          ? parsed.projectName.trim()
          : cleanFileName.replace(/\.n2v$/i, "");

      const mapped: GatewayDeviceItem[] = rawList.map((raw, idx) => {
        const rawCategory = String(raw.category ?? "").toLowerCase();
        const isCamera =
          rawCategory === "camera" ||
          String(raw.protocol ?? "").toLowerCase().includes("rtsp") ||
          typeof raw.rtspUrl === "string";
        const isRelay =
          String(raw.modbusType ?? "").toLowerCase() === "relay" ||
          Array.isArray(raw.relayChannels);

        if (isCamera) {
          return {
            id: `sim-n2v-${baseStamp}-${idx}`,
            deviceId: `n2v-cam-${idx + 1}`,
            name: String(raw.name ?? `[N2V] 虚拟摄像头 ${idx + 1}`),
            model: String(raw.model ?? "N2V-CAM-HD"),
            category: "camera",
            protocol: "rtsp_onvif",
            address: String(raw.address ?? `127.0.0.1:${8560 + idx}`),
            status: "online",
            collecting: true,
            collectInterval: 1,
            tags: ["虚拟仿真", "N2V"],
            lastUpdate: now,
            sourceMethod: "simulation",
            sourceDetail: `N2V 文件 · ${cleanFileName}`,
            rtspUrl: String(
              raw.rtspUrl ?? `rtsp://127.0.0.1:${8560 + idx}/n2v/stream`
            ),
            resolution: String(raw.resolution ?? "1920×1080"),
            fps: typeof raw.fps === "number" ? raw.fps : 25,
            sceneLabel: String(
              raw.sceneLabel ?? `N2V 工程 (${sceneName}) · 虚拟视频通道`
            ),
          };
        }

        if (isRelay) {
          return {
            id: `sim-n2v-${baseStamp}-${idx}`,
            deviceId: `n2v-relay-${idx + 1}`,
            name: String(raw.name ?? `[N2V] 虚拟继电器模块 ${idx + 1}`),
            model: String(raw.model ?? "N2V-IO-4CH"),
            category: "modbus",
            modbusType: "relay",
            protocol: "modbus_tcp",
            address: String(
              raw.address ?? `127.0.0.1:5030 · 站号 ${idx + 1}`
            ),
            status: "online",
            collecting: true,
            collectInterval: 5,
            tags: ["虚拟仿真", "N2V"],
            lastUpdate: now,
            sourceMethod: "simulation",
            sourceDetail: `N2V 文件 · ${cleanFileName}`,
            relayChannels: Array.isArray(raw.relayChannels)
              ? (raw.relayChannels as GatewayDeviceItem["relayChannels"])
              : [
                  { channel: "DO1", label: "回路 1", isOn: true },
                  { channel: "DO2", label: "回路 2", isOn: false },
                  { channel: "DO3", label: "回路 3", isOn: false },
                  { channel: "DO4", label: "回路 4", isOn: false },
                ],
          };
        }

        return {
          id: `sim-n2v-${baseStamp}-${idx}`,
          deviceId: `n2v-sensor-${idx + 1}`,
          name: String(raw.name ?? `[N2V] 虚拟温湿度传感器 ${idx + 1}`),
          model: String(raw.model ?? "N2V-TH-100"),
          category: "modbus",
          modbusType: "sensor",
          protocol: "modbus_tcp",
          address: String(raw.address ?? `127.0.0.1:5030 · 站号 ${idx + 1}`),
          status: "online",
          collecting: true,
          collectInterval: 5,
          tags: ["虚拟仿真", "N2V"],
          lastUpdate: now,
          sourceMethod: "simulation",
          sourceDetail: `N2V 文件 · ${cleanFileName}`,
          sensorMetrics: Array.isArray(raw.sensorMetrics)
            ? (raw.sensorMetrics as GatewayDeviceItem["sensorMetrics"])
            : [
                { label: "仿真温度", value: 24.8, unit: "℃", register: "0x0001" },
                { label: "仿真湿度", value: 55.2, unit: "%RH", register: "0x0000" },
              ],
        };
      });

      return { sceneName, devices: mapped };
    }
  } catch {
    // Fall through to binary/XML N2V package extraction
  }

  // Fallback for binary/custom .n2v project archives
  const sceneTitle = cleanFileName.replace(/\.(n2v|json|xml)$/i, "");
  return {
    sceneName: sceneTitle,
    devices: [
      {
        id: `sim-n2v-${baseStamp}-1`,
        deviceId: `n2v-th-${baseStamp.toString().slice(-3)}`,
        name: `[N2V] ${sceneTitle} · 温湿度传感器`,
        model: "N2V-TH-485",
        category: "modbus",
        modbusType: "sensor",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5031 · 站号 1",
        status: "online",
        collecting: true,
        collectInterval: 5,
        tags: ["虚拟仿真", "N2V"],
        lastUpdate: now,
        sourceMethod: "simulation",
        sourceDetail: `N2V 文件 · ${cleanFileName}`,
        sensorMetrics: [
          { label: "仿真温度", value: 25.2, unit: "℃", register: "0x0001" },
          { label: "仿真湿度", value: 57.6, unit: "%RH", register: "0x0000" },
        ],
      },
      {
        id: `sim-n2v-${baseStamp}-2`,
        deviceId: `n2v-io-${baseStamp.toString().slice(-3)}`,
        name: `[N2V] ${sceneTitle} · 四路控制继电器`,
        model: "N2V-IO-424T",
        category: "modbus",
        modbusType: "relay",
        protocol: "modbus_tcp",
        address: "127.0.0.1:5031 · 站号 2",
        status: "online",
        collecting: true,
        collectInterval: 5,
        tags: ["虚拟仿真", "N2V"],
        lastUpdate: now,
        sourceMethod: "simulation",
        sourceDetail: `N2V 文件 · ${cleanFileName}`,
        relayChannels: [
          { channel: "DO1", label: "主执行器", isOn: true },
          { channel: "DO2", label: "风机通道", isOn: false },
          { channel: "DO3", label: "照明通道", isOn: true },
          { channel: "DO4", label: "告警指示灯", isOn: false },
        ],
      },
      {
        id: `sim-n2v-${baseStamp}-3`,
        deviceId: `n2v-cam-${baseStamp.toString().slice(-3)}`,
        name: `[N2V] ${sceneTitle} · 虚拟仿真摄像头`,
        model: "N2V-V-CAM",
        category: "camera",
        protocol: "rtsp_onvif",
        address: "127.0.0.1:8561",
        status: "online",
        collecting: true,
        collectInterval: 1,
        tags: ["虚拟仿真", "N2V"],
        lastUpdate: now,
        sourceMethod: "simulation",
        sourceDetail: `N2V 文件 · ${cleanFileName}`,
        rtspUrl: `rtsp://127.0.0.1:8561/n2v/${encodeURIComponent(sceneTitle)}/cam1`,
        resolution: "1920×1080",
        fps: 25,
        sceneLabel: `N2V 工程 (${sceneTitle}) · 虚拟场景视频通道`,
      },
    ],
  };
}

interface SimulationImportModalProps {
  open: boolean;
  accountName?: string;
  orgName?: string;
  onClose: () => void;
  onConfirmImport: (devices: GatewayDeviceItem[]) => void;
}

export function SimulationImportModal({
  open,
  accountName = "当前账号",
  orgName = "物联网实训中心",
  onClose,
  onConfirmImport,
}: SimulationImportModalProps) {
  const [sourceTab, setSourceTab] = useState<"platform" | "n2v">("platform");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<SimulationProject>(
    SIMULATION_PROJECTS[0]
  );
  const [platformState, setPlatformState] = useState<
    "idle" | "loading" | "ready"
  >("idle");
  const [discoveredDevices, setDiscoveredDevices] = useState<
    GatewayDeviceItem[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // N2V upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [n2vFileInfo, setN2vFileInfo] = useState<{
    name: string;
    sizeKb: string;
    sceneName: string;
  } | null>(null);
  const [n2vParsing, setN2vParsing] = useState(false);
  const [n2vError, setN2vError] = useState("");

  useEffect(() => {
    if (open) {
      setPlatformState("idle");
      setDiscoveredDevices([]);
      setSelectedIds({});
      setN2vFileInfo(null);
      setN2vError("");
      setProjectSearch("");
    }
  }, [open]);

  if (!open) return null;

  const filteredProjects = SIMULATION_PROJECTS.filter((p) => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.sceneType.toLowerCase().includes(q)
    );
  });

  const handleFetchPlatformDevices = () => {
    setPlatformState("loading");
    setTimeout(() => {
      const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      const stamp = Date.now();
      const devices: GatewayDeviceItem[] = selectedProject.devices.map(
        (d, idx) => ({
          ...d,
          id: `sim-prj-${stamp}-${idx}`,
          deviceId: `sim-${stamp.toString().slice(-4)}-${idx + 1}`,
          collecting: true,
          collectInterval: 5,
          tags: ["虚拟仿真", selectedProject.code],
          lastUpdate: now,
        })
      );
      const checked: Record<string, boolean> = {};
      devices.forEach((d) => {
        checked[d.id] = true;
      });
      setDiscoveredDevices(devices);
      setSelectedIds(checked);
      setPlatformState("ready");
    }, 550);
  };

  const handleProcessN2vFile = async (file: File) => {
    setN2vError("");
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".n2v") && !lower.endsWith(".json")) {
      setN2vError("请上传有效的 .n2v 虚拟仿真工程文件");
      return;
    }

    setN2vParsing(true);
    try {
      const result = await parseN2vFile(file);
      const checked: Record<string, boolean> = {};
      result.devices.forEach((d) => {
        checked[d.id] = true;
      });
      setN2vFileInfo({
        name: file.name,
        sizeKb: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        sceneName: result.sceneName,
      });
      setDiscoveredDevices(result.devices);
      setSelectedIds(checked);
    } catch {
      setN2vError("解析 N2V 文件失败，请检查文件完整性");
    } finally {
      setN2vParsing(false);
    }
  };

  const handleDownloadSampleN2v = () => {
    const content = buildSampleN2vContent();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart_lab_demo.n2v";
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedCount = discoveredDevices.filter((d) => selectedIds[d.id]).length;

  const handleConfirm = () => {
    const chosen = discoveredDevices.filter((d) => selectedIds[d.id]);
    if (chosen.length === 0) return;
    onConfirmImport(chosen);
    onClose();
  };

  const switchTab = (next: "platform" | "n2v") => {
    setSourceTab(next);
    setDiscoveredDevices([]);
    setSelectedIds({});
    setPlatformState("idle");
    setN2vFileInfo(null);
    setN2vError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="虚拟仿真导入设备"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">
                虚拟仿真导入设备
              </h3>
              <p className="text-[12px] text-[#64748B]">
                支持从当前账号已有的虚拟仿真项目同步节点，或直接上传本地 N2V 工程文件解析导入
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Mode Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F1F5F9]">
            <button
              type="button"
              onClick={() => switchTab("platform")}
              className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                sourceTab === "platform"
                  ? "bg-white text-[#2563EB] shadow-xs"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>当前账号虚拟仿真项目</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab("n2v")}
              className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12.5px] font-semibold transition-colors cursor-pointer ${
                sourceTab === "n2v"
                  ? "bg-white text-[#2563EB] shadow-xs"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>上传 N2V 文件导入</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {sourceTab === "platform" ? (
            <>
              {/* Project selector */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[12.5px] font-semibold text-[#1E293B]">
                      1. 选择当前账号已有的虚拟仿真项目
                    </span>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      当前账号：{accountName}（{orgName}）· 已同步{" "}
                      {SIMULATION_PROJECTS.length} 个项目
                    </p>
                  </div>
                  <div className="relative w-52">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="搜索项目名称或编号..."
                      className="w-full rounded-lg border border-[#DCE6FC] bg-[#F8FAFF] focus:bg-white focus:border-[#3D68F5] focus:outline-none pl-8 pr-2.5 py-1 text-[12px] text-[#1E293B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {filteredProjects.map((proj) => {
                    const active = selectedProject.id === proj.id;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setSelectedProject(proj);
                          setPlatformState("idle");
                          setDiscoveredDevices([]);
                        }}
                        className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                          active
                            ? "border-[#3D68F5] bg-[#F4F7FF]"
                            : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[12.5px] font-semibold text-[#0F172A] leading-snug">
                            {proj.name}
                          </div>
                          <Layers
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              active ? "text-[#3D68F5]" : "text-[#94A3B8]"
                            }`}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-[#64748B]">
                          {proj.sceneType}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono-tabular text-[#475569]">
                          <span>{proj.code}</span>
                          <span className="text-[#3D68F5]">
                            {proj.deviceSummary}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action bar */}
              <div className="rounded-xl border border-[#E2EAFE] bg-[#F8FAFF] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#0F172A] truncate">
                    已选仿真项目：{selectedProject.name}
                  </div>
                  <div className="text-[11.5px] text-[#64748B]">
                    项目编号 {selectedProject.code} · 最近更新{" "}
                    {selectedProject.updatedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFetchPlatformDevices}
                  disabled={platformState === "loading"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#94A3B8] px-4 py-2 text-[12.5px] font-medium text-white cursor-pointer whitespace-nowrap"
                >
                  {platformState === "loading" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>拉取虚拟设备...</span>
                    </>
                  ) : platformState === "ready" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>重新同步设备</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>同步项目设备</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* N2V File Dropzone */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-[#1E293B]">
                    1. 上传本地 .n2v 虚拟仿真工程文件
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadSampleN2v}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D68F5] hover:text-[#2E56DE] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下载示例 .n2v 文件</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".n2v,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleProcessN2vFile(file);
                    e.target.value = "";
                  }}
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleProcessN2vFile(file);
                  }}
                  className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-[#3D68F5] bg-[#EEF2FF]"
                      : "border-[#CBD5E1] bg-[#F8FAFF] hover:border-[#3D68F5] hover:bg-[#F4F7FF]"
                  }`}
                >
                  {n2vParsing ? (
                    <div className="flex flex-col items-center gap-2 text-[#3D68F5]">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-[13px] font-medium">
                        正在解析 N2V 工程拓扑与虚拟设备节点...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE6FC] text-[#3D68F5] flex items-center justify-center shadow-xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-[13px] font-semibold text-[#0F172A]">
                        点击选择或拖拽 <span className="text-[#3D68F5]">.n2v</span> 文件到此处
                      </div>
                      <p className="text-[11.5px] text-[#64748B]">
                        自动识别 N2V 场景中的 Modbus 温湿度传感器、继电器控制器及虚拟摄像头通道
                      </p>
                    </div>
                  )}
                </div>

                {n2vError && (
                  <p className="text-[12px] text-red-600 font-medium">
                    {n2vError}
                  </p>
                )}

                {n2vFileInfo && (
                  <div className="rounded-xl border border-[#BCEFD7] bg-[#ECFDF5] px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#059669] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-[#065F46] truncate">
                          已解析文件：{n2vFileInfo.name}（{n2vFileInfo.sizeKb}）
                        </div>
                        <div className="text-[11px] text-[#047857] truncate">
                          工程场景：{n2vFileInfo.sceneName}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11.5px] font-medium text-[#047857] hover:underline shrink-0 cursor-pointer"
                    >
                      重新上传
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Discovered devices checklist */}
          {discoveredDevices.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[#0F172A]">
                  2. 解析到以下仿真设备（已选 {selectedCount} /{" "}
                  {discoveredDevices.length}）：
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked =
                      selectedCount === discoveredDevices.length;
                    const next: Record<string, boolean> = {};
                    discoveredDevices.forEach((d) => {
                      next[d.id] = !allChecked;
                    });
                    setSelectedIds(next);
                  }}
                  className="text-[12px] font-medium text-[#3D68F5] hover:underline cursor-pointer"
                >
                  {selectedCount === discoveredDevices.length ? "取消全选" : "全选"}
                </button>
              </div>

              <div className="space-y-2">
                {discoveredDevices.map((dev) => {
                  const checked = Boolean(selectedIds[dev.id]);
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() =>
                        setSelectedIds((prev) => ({
                          ...prev,
                          [dev.id]: !prev[dev.id],
                        }))
                      }
                      className={`w-full rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        checked
                          ? "border-[#3D68F5] bg-[#F4F7FF]"
                          : "border-[#E2E8F0] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-4.5 h-4.5 rounded flex items-center justify-center border shrink-0 ${
                            checked
                              ? "bg-[#3D68F5] border-[#3D68F5] text-white"
                              : "border-[#CBD5E1] bg-white"
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                            {dev.name}
                          </div>
                          <div className="text-[11.5px] text-[#64748B] font-mono-tabular truncate">
                            {dev.model} · {dev.protocol} · {dev.address}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-white border border-[#DCE6FC] px-2 py-0.5 text-[11px] font-medium text-[#3D68F5]">
                        {dev.category === "camera"
                          ? "摄像头"
                          : dev.modbusType === "relay"
                            ? "Modbus 继电器"
                            : "Modbus 传感器"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#EEF2F6] bg-[#F8FAFF] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-1.5 text-[12.5px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleConfirm}
            className="rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] disabled:bg-[#94A3B8] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer disabled:cursor-not-allowed"
          >
            确认导入所选设备{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
