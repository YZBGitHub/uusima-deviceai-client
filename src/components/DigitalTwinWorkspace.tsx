import {
  AlertCircle,
  ArrowRightLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Fan,
  Lightbulb,
  Power,
  Radio,
  Router,
  Search,
  Video,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DigitalTwinNodePosition, DigitalTwinProject } from "../types/digitalTwin";
import type { GatewayDeviceItem } from "../types/gateway";
import { CameraLiveMonitorModal } from "./CameraLiveMonitorModal";
import {
  DigitalTwinCanvas,
  getDefaultNodePositions,
} from "./DigitalTwinCanvas";

interface DigitalTwinWorkspaceProps {
  devices: GatewayDeviceItem[];
  onUpdateDevices: (
    updater: (prev: GatewayDeviceItem[]) => GatewayDeviceItem[]
  ) => void;
  accountName: string;
  orgId: string;
  onLogEvent?: (module: string, message: string) => void;
}

function buildStarterProjects(
  accountName: string,
  orgId: string
): DigitalTwinProject[] {
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  return [
    {
      id: `dt-proj-${orgId}-01`,
      name: "实训室环境与继电器数字孪生工程",
      code: "DT-N2V-001",
      sceneType: "工业物联网 · 温湿度与IO联动",
      accountName,
      orgId,
      createdAt: now,
      updatedAt: now,
      syncedDeviceIds: [],
      nodePositions: {},
    },
    {
      id: `dt-proj-${orgId}-02`,
      name: "产线视觉质检与PLC联调仿真项目",
      code: "DT-N2V-002",
      sceneType: "智能制造 · 工业视觉与控制",
      accountName,
      orgId,
      createdAt: now,
      updatedAt: now,
      syncedDeviceIds: [],
      nodePositions: {},
    },
  ];
}

export function DigitalTwinWorkspace({
  devices,
  onUpdateDevices,
  accountName,
  orgId,
  onLogEvent,
}: DigitalTwinWorkspaceProps) {
  const storageKey = `digital_twin_projects_v1_${orgId}_${accountName}`;

  const [projects, setProjects] = useState<DigitalTwinProject[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return buildStarterProjects(accountName, orgId);
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
          setActiveProjectId(null);
          return;
        }
      }
    } catch {
      // ignore
    }
    setProjects(buildStarterProjects(accountName, orgId));
    setActiveProjectId(null);
  }, [storageKey, accountName, orgId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects, storageKey]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [highlightProjectSelect, setHighlightProjectSelect] = useState(false);

  // Left Southbound Device List Filters, Multi-Select & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "sensor" | "relay" | "fan" | "light" | "gateway" | "camera"
  >("all");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [notice, setNotice] = useState<{
    type: "info" | "warning" | "success";
    text: string;
  } | null>(null);

  // New Simulation Project Modal
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjScene, setNewProjScene] = useState("工业物联网 · 综合实训场景");

  // Live Camera Monitor Window
  const [monitorCameraId, setMonitorCameraId] = useState<string | null>(null);

  // Resizable Split Pane
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [leftWidthPct, setLeftWidthPct] = useState(34);
  const [isResizingSplit, setIsResizingSplit] = useState(false);

  const handleSplitPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;

    setIsResizingSplit(true);
    const updateWidth = (clientX: number) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setLeftWidthPct(Math.min(62, Math.max(22, Number(pct.toFixed(2)))));
    };

    const handleMove = (moveEvent: PointerEvent) => {
      updateWidth(moveEvent.clientX);
    };

    const handleUp = () => {
      setIsResizingSplit(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  const monitorCamera = useMemo(
    () => devices.find((d) => d.id === monitorCameraId) ?? null,
    [devices, monitorCameraId]
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  const showNotice = (type: "info" | "warning" | "success", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => {
      setNotice((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return devices.filter((d) => {
      if (categoryFilter === "sensor" && d.modbusType !== "sensor") return false;
      if (categoryFilter === "relay" && d.modbusType !== "relay") return false;
      if (categoryFilter === "fan" && d.category !== "fan") return false;
      if (categoryFilter === "light" && d.category !== "light") return false;
      if (categoryFilter === "gateway" && d.category !== "gateway") return false;
      if (categoryFilter === "camera" && d.category !== "camera") return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.deviceId.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.protocol.toLowerCase().includes(q)
      );
    });
  }, [devices, searchQuery, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDevices = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, safePage, pageSize]);

  const selectedDeviceIds = useMemo(
    () => devices.filter((d) => selectedIds[d.id]).map((d) => d.id),
    [devices, selectedIds]
  );

  const allFilteredSelected =
    filteredDevices.length > 0 &&
    filteredDevices.every((d) => selectedIds[d.id]);

  // Sync selected southbound devices -> active simulation project
  const handleSyncToSimulation = () => {
    if (!activeProjectId || !activeProject) {
      setHighlightProjectSelect(true);
      showNotice("warning", "请先在右侧选择或新建仿真项目");
      window.setTimeout(() => setHighlightProjectSelect(false), 2600);
      return;
    }

    if (selectedDeviceIds.length === 0) {
      showNotice("warning", "请先勾选至少 1 台设备");
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const mergedIds = Array.from(
      new Set([...activeProject.syncedDeviceIds, ...selectedDeviceIds])
    );

    const defaults = getDefaultNodePositions(mergedIds);
    const mergedPositions: Record<string, DigitalTwinNodePosition> = {
      ...defaults,
      ...activeProject.nodePositions,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              updatedAt: now,
              syncedDeviceIds: mergedIds,
              nodePositions: mergedPositions,
            }
          : p
      )
    );

    onLogEvent?.(
      "digital-twin.sync",
      `synced ${selectedDeviceIds.length} southbound device(s) -> project="${activeProject.name}"`
    );
    showNotice(
      "success",
      `已同步 ${selectedDeviceIds.length} 台设备至「${activeProject.name}」`
    );
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");
    const code = `DT-N2V-${String(projects.length + 1).padStart(3, "0")}`;
    const created: DigitalTwinProject = {
      id: `dt-proj-${Date.now()}`,
      name: newProjName.trim(),
      code,
      sceneType: newProjScene.trim() || "工业物联网 · 综合实训场景",
      accountName,
      orgId,
      createdAt: now,
      updatedAt: now,
      syncedDeviceIds: [],
      nodePositions: {},
    };
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    setHighlightProjectSelect(false);
    setNewProjName("");
    setNewProjectOpen(false);
    onLogEvent?.(
      "digital-twin.project",
      `created simulation project="${created.name}" (${created.code})`
    );
    showNotice("success", `已新建项目「${created.name}」`);
  };

  // Bidirectional device state mutators
  const handleToggleDeviceOnline = (deviceId: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const nextStatus = d.status === "online" ? "offline" : "online";
        return {
          ...d,
          status: nextStatus,
          collecting: nextStatus === "offline" ? false : d.collecting,
          fanRunning:
            d.category === "fan" && nextStatus === "offline"
              ? false
              : d.fanRunning,
          lightOn:
            d.category === "light" && nextStatus === "offline"
              ? false
              : d.lightOn,
          lastUpdate: now,
        };
      })
    );
  };

  const handleToggleDeviceCollecting = (deviceId: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const nextCollecting = !d.collecting;
        return {
          ...d,
          collecting: nextCollecting,
          status: nextCollecting ? "online" : d.status,
          fanRunning: d.category === "fan" ? nextCollecting : d.fanRunning,
          lightOn: d.category === "light" ? nextCollecting : d.lightOn,
          lastUpdate: now,
        };
      })
    );
  };

  const handleToggleFan = (deviceId: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    let nextState = false;
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const currentRunning =
          d.status === "online" && Boolean(d.fanRunning ?? d.collecting);
        nextState = !currentRunning;
        return {
          ...d,
          status: nextState ? "online" : d.status,
          collecting: nextState,
          fanRunning: nextState,
          lastUpdate: now,
        };
      })
    );
    onLogEvent?.(
      "digital-twin.fan",
      `device=${deviceId} fan -> ${nextState ? "ON (spinning)" : "OFF (stopped)"}`
    );
  };

  const handleToggleLight = (deviceId: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    let nextState = false;
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId) return d;
        const currentOn =
          d.status === "online" && Boolean(d.lightOn ?? d.collecting);
        nextState = !currentOn;
        return {
          ...d,
          status: nextState ? "online" : d.status,
          collecting: nextState,
          lightOn: nextState,
          lastUpdate: now,
        };
      })
    );
    onLogEvent?.(
      "digital-twin.light",
      `device=${deviceId} light -> ${nextState ? "ON (glowing)" : "OFF"}`
    );
  };

  const handleBatchSetDevicesState = (deviceIds: string[], online: boolean) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    const setIds = new Set(deviceIds);
    onUpdateDevices((prev) =>
      prev.map((d) =>
        setIds.has(d.id)
          ? {
              ...d,
              status: online ? "online" : "offline",
              collecting: online,
              fanRunning: d.category === "fan" ? online : d.fanRunning,
              lightOn: d.category === "light" ? online : d.lightOn,
              lastUpdate: now,
            }
          : d
      )
    );
    onLogEvent?.(
      "digital-twin.control",
      `batch ${online ? "START" : "STOP"} ${deviceIds.length} simulated device(s)`
    );
  };

  const handleToggleRelayChannel = (deviceId: string, channel: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateDevices((prev) =>
      prev.map((d) => {
        if (d.id !== deviceId || !d.relayChannels) return d;
        return {
          ...d,
          status: "online",
          lastUpdate: now,
          relayChannels: d.relayChannels.map((ch) =>
            ch.channel === channel ? { ...ch, isOn: !ch.isOn } : ch
          ),
        };
      })
    );
    onLogEvent?.(
      "digital-twin.relay",
      `device=${deviceId} channel=${channel} toggled (bidirectional sync)`
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      {/* Compact Notification */}
      {notice && (
        <div
          className={`rounded-xl border px-4 py-2 text-[12.5px] flex items-center justify-between gap-3 shrink-0 ${
            notice.type === "warning"
              ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
              : notice.type === "success"
                ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
                : "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
          }`}
        >
          <span className="inline-flex items-center gap-2 font-medium">
            {notice.type === "warning" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[12px] hover:underline cursor-pointer shrink-0"
          >
            关闭
          </button>
        </div>
      )}

      {/* Resizable Split View with Matched Height on Left & Right */}
      <div
        ref={splitContainerRef}
        style={
          {
            "--dt-left-w": `${leftWidthPct}%`,
          } as CSSProperties
        }
        className={`flex-1 flex flex-col lg:flex-row items-stretch min-h-0 gap-4 lg:gap-0 lg:overflow-hidden ${
          isResizingSplit ? "select-none" : ""
        }`}
      >
        {/* LEFT: 南向设备列表 */}
        <section
          aria-label="南向设备列表"
          className="w-full lg:w-[var(--dt-left-w)] lg:shrink-0 max-h-[540px] lg:max-h-none h-full min-h-0 rounded-2xl border border-[#DCE6FC] bg-white flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(68,100,235,0.04)]"
        >
          {/* Left Header */}
          <div className="px-4 py-3 border-b border-[#EEF2F6] bg-[#F8FAFF] space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14.5px] font-bold text-[#0F172A]">
                南向设备列表
              </h2>
              <button
                type="button"
                onClick={handleSyncToSimulation}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>
                  同步到仿真
                  {selectedDeviceIds.length > 0
                    ? ` (${selectedDeviceIds.length})`
                    : ""}
                </span>
              </button>
            </div>

            {/* Select All & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = { ...selectedIds };
                  filteredDevices.forEach((d) => {
                    next[d.id] = !allFilteredSelected;
                  });
                  setSelectedIds(next);
                }}
                className="rounded-lg border border-[#DCE6FC] bg-white hover:bg-[#F1F5FF] px-2.5 py-1.5 text-[11.5px] font-medium text-[#3D68F5] cursor-pointer whitespace-nowrap"
              >
                {allFilteredSelected ? "取消全选" : "全选"}
              </button>

              <div className="relative flex-1 min-w-[150px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="搜索设备名称 / ID / 协议"
                  className="w-full rounded-lg border border-[#DCE6FC] bg-white focus:border-[#3D68F5] focus:outline-none pl-8 pr-6 py-1.5 text-[12px] text-[#1E293B]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {[
                { key: "all" as const, label: "全部" },
                { key: "sensor" as const, label: "传感器" },
                { key: "relay" as const, label: "继电器" },
                { key: "fan" as const, label: "风扇" },
                { key: "light" as const, label: "灯泡" },
                { key: "gateway" as const, label: "网关" },
                { key: "camera" as const, label: "摄像头" },
              ].map((tab) => {
                const active = categoryFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-[#3D68F5] text-white"
                        : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Scrollable Device List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
            {paginatedDevices.length === 0 ? (
              <div className="py-12 text-center text-[12.5px] text-[#64748B]">
                暂无匹配的南向设备
              </div>
            ) : (
              paginatedDevices.map((dev) => {
                const checked = Boolean(selectedIds[dev.id]);
                const isSyncedInProject = Boolean(
                  activeProject?.syncedDeviceIds.includes(dev.id)
                );
                const isOnline = dev.status === "online";

                return (
                  <div
                    key={dev.id}
                    className={`rounded-xl border p-3 transition-colors space-y-2 ${
                      checked
                        ? "border-[#3D68F5] bg-[#F4F7FF]/70"
                        : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1]"
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={`选择设备 ${dev.name}`}
                          onClick={() =>
                            setSelectedIds((prev) => ({
                              ...prev,
                              [dev.id]: !prev[dev.id],
                            }))
                          }
                          className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center border shrink-0 cursor-pointer transition-colors ${
                            checked
                              ? "bg-[#3D68F5] border-[#3D68F5] text-white"
                              : "border-[#CBD5E1] bg-white hover:border-[#3D68F5]"
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-bold text-[#0F172A] truncate max-w-[170px]">
                              {dev.name}
                            </span>
                            {isSyncedInProject && (
                              <span className="text-[10.5px] font-semibold text-[#3D68F5]">
                                · 已同步
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11px] font-mono-tabular text-[#64748B] truncate">
                            {dev.deviceId} · {dev.model} · {dev.protocol}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleDeviceOnline(dev.id)}
                        className={`rounded border px-2 py-0.5 text-[11px] font-semibold cursor-pointer transition-colors shrink-0 ${
                          isOnline
                            ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]"
                            : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {isOnline ? "在线" : "离线"}
                      </button>
                    </div>

                    {/* Device-specific controls */}
                    {dev.category === "camera" ? (
                      <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#475569] font-mono-tabular truncate">
                          <Camera className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                          <span>
                            {dev.resolution ?? "1920×1080"} · {dev.fps ?? 25}fps
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleDeviceCollecting(dev.id)}
                            className={`rounded px-2 py-1 text-[11px] font-medium border cursor-pointer ${
                              dev.collecting
                                ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                                : "border-[#E2E8F0] bg-white text-[#64748B]"
                            }`}
                          >
                            {dev.collecting ? "推流" : "暂停"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMonitorCameraId(dev.id)}
                            className="inline-flex items-center gap-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] px-2.5 py-1 text-[11px] font-semibold text-white cursor-pointer"
                          >
                            <Video className="w-3 h-3" />
                            <span>实时监控</span>
                          </button>
                        </div>
                      </div>
                    ) : dev.modbusType === "relay" && dev.relayChannels ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {dev.relayChannels.map((ch) => {
                          const active = ch.isOn && isOnline;
                          return (
                            <button
                              key={ch.channel}
                              type="button"
                              role="switch"
                              aria-checked={active}
                              onClick={() =>
                                handleToggleRelayChannel(dev.id, ch.channel)
                              }
                              className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                                active
                                  ? "border-[#22C55E] bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]"
                                  : "border-[#CBD5E1] bg-white text-[#334155] hover:border-[#3D68F5] hover:bg-[#F8FAFF]"
                              }`}
                            >
                              <span className="truncate font-medium">
                                {ch.channel} {ch.label}
                              </span>
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <span
                                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                    active ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform ${
                                      active ? "translate-x-3.5" : "translate-x-0.5"
                                    }`}
                                  />
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : dev.category === "fan" ? (
                      (() => {
                        const fanOn =
                          isOnline && Boolean(dev.fanRunning ?? dev.collecting);
                        return (
                          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${
                                  fanOn
                                    ? "bg-[#E0F2FE] border-[#38BDF8] text-[#0284C7]"
                                    : "bg-white border-[#CBD5E1] text-[#64748B]"
                                }`}
                              >
                                <Fan
                                  className={`w-4 h-4 ${fanOn ? "animate-spin" : ""}`}
                                  style={
                                    fanOn
                                      ? { animationDuration: "0.9s" }
                                      : undefined
                                  }
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11.5px] font-semibold text-[#0F172A]">
                                  {fanOn ? "风扇运转中" : "风扇已停止"}
                                </div>
                                <div className="text-[10.5px] text-[#64748B] truncate">
                                  {dev.address}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={fanOn}
                              onClick={() => handleToggleFan(dev.id)}
                              className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98] ${
                                fanOn
                                  ? "border-[#0284C7] bg-[#0EA5E9]/10 text-[#0369A1]"
                                  : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#3D68F5]"
                              }`}
                            >
                              <span>{fanOn ? "开启" : "关闭"}</span>
                              <span
                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                  fanOn ? "bg-[#0284C7]" : "bg-[#CBD5E1]"
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
                        );
                      })()
                    ) : dev.category === "light" ? (
                      (() => {
                        const bulbOn =
                          isOnline && Boolean(dev.lightOn ?? dev.collecting);
                        return (
                          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 transition-all duration-300 ${
                                  bulbOn
                                    ? "bg-[#FEF9C3] border-[#FACC15] text-[#CA8A04] shadow-[0_0_10px_rgba(250,204,21,0.45)]"
                                    : "bg-white border-[#CBD5E1] text-[#64748B]"
                                }`}
                              >
                                <Lightbulb
                                  className={`w-4 h-4 ${
                                    bulbOn ? "animate-pulse" : ""
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11.5px] font-semibold text-[#0F172A]">
                                  {bulbOn ? "照明点亮中" : "照明已关闭"}
                                </div>
                                <div className="text-[10.5px] text-[#64748B] truncate">
                                  {dev.address}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={bulbOn}
                              onClick={() => handleToggleLight(dev.id)}
                              className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98] ${
                                bulbOn
                                  ? "border-[#CA8A04] bg-[#FEF08A]/40 text-[#A16207]"
                                  : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#3D68F5]"
                              }`}
                            >
                              <span>{bulbOn ? "开启" : "关闭"}</span>
                              <span
                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                  bulbOn ? "bg-[#EAB308]" : "bg-[#CBD5E1]"
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
                        );
                      })()
                    ) : dev.category === "gateway" ? (
                      (() => {
                        const gwRunning = isOnline && dev.collecting;
                        return (
                          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Router className="w-4 h-4 text-[#3D68F5] shrink-0" />
                              <span className="text-[11px] font-mono-tabular text-[#475569] truncate">
                                {dev.address}
                              </span>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={gwRunning}
                              onClick={() => handleToggleDeviceCollecting(dev.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs shrink-0 active:scale-[0.98] ${
                                gwRunning
                                  ? "border-[#22C55E] bg-[#ECFDF5] text-[#059669]"
                                  : "border-[#CBD5E1] bg-white text-[#475569] hover:border-[#3D68F5]"
                              }`}
                            >
                              <span>{gwRunning ? "运行" : "暂停"}</span>
                              <span
                                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                                  gwRunning ? "bg-[#16A34A]" : "bg-[#CBD5E1]"
                                }`}
                              >
                                <span
                                  className={`inline-block h-3 w-3 rounded-full bg-white shadow-xs transition-transform ${
                                    gwRunning
                                      ? "translate-x-3.5"
                                      : "translate-x-0.5"
                                  }`}
                                />
                              </span>
                            </button>
                          </div>
                        );
                      })()
                    ) : dev.sensorMetrics && dev.sensorMetrics.length > 0 ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          {dev.sensorMetrics.slice(0, 2).map((m) => (
                            <div
                              key={m.label}
                              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5"
                            >
                              <div className="text-[10.5px] text-[#64748B] truncate">
                                {m.key === "temperature"
                                  ? "温度"
                                  : m.key === "humidity"
                                    ? "湿度"
                                    : m.key || m.label}
                              </div>
                              <div className="text-[13px] font-bold font-mono-tabular text-[#0F172A]">
                                {m.value} {m.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                          <span className="inline-flex items-center gap-1">
                            <Radio
                              className={`w-3 h-3 ${
                                dev.collecting && isOnline
                                  ? "text-[#16A34A]"
                                  : "text-[#94A3B8]"
                              }`}
                            />
                            <span>
                              {dev.collecting && isOnline ? "只读实时监测" : "已停止"}
                            </span>
                          </span>
                          <span className="font-mono-tabular text-[10.5px]">
                            {dev.address}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] bg-[#F8FAFC] rounded-lg px-2.5 py-1.5">
                        <span className="inline-flex items-center gap-1 truncate">
                          <Cpu className="w-3 h-3" />
                          <span>{dev.address}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleDeviceCollecting(dev.id)}
                          className="inline-flex items-center gap-1 text-[#3D68F5] hover:underline cursor-pointer shrink-0"
                        >
                          <Power className="w-3 h-3" />
                          <span>{dev.collecting ? "停止" : "启动"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Left Pagination Footer aligned with Right Bottom Bar */}
          <div className="px-3.5 py-2 border-t border-[#E5E7EB] bg-white flex items-center justify-between gap-2 text-[12px] shrink-0">
            <span className="text-[#64748B] font-mono-tabular whitespace-nowrap">
              共 {filteredDevices.length} 条
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="上一页"
                className="w-7 h-7 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 flex items-center justify-center text-[#475569] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 min-w-7 px-2 rounded border font-mono-tabular font-medium cursor-pointer ${
                    page === safePage
                      ? "border-[#3D68F5] bg-[#EFF6FF] text-[#3D68F5]"
                      : "border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                aria-label="下一页"
                className="w-7 h-7 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 flex items-center justify-center text-[#475569] cursor-pointer"
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
                className="h-7 rounded border border-[#E2E8F0] bg-white px-1.5 text-[11.5px] text-[#475569] focus:border-[#3D68F5] focus:outline-none cursor-pointer ml-1"
              >
                <option value={4}>4/页</option>
                <option value={6}>6/页</option>
                <option value={10}>10/页</option>
              </select>
            </div>
          </div>
        </section>

        {/* Draggable Split Resizer Divider */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="拖动调整左右面板宽度"
          onPointerDown={handleSplitPointerDown}
          title="拖动调整左右宽度"
          className="hidden lg:flex w-3.5 shrink-0 items-center justify-center cursor-col-resize group select-none"
        >
          <div
            className={`w-[3px] h-14 rounded-full transition-colors ${
              isResizingSplit
                ? "bg-[#3D68F5]"
                : "bg-[#CBD5E1] group-hover:bg-[#3D68F5]"
            }`}
          />
        </div>

        {/* RIGHT: 虚拟仿真界面 */}
        <section
          aria-label="虚拟仿真界面"
          className="flex-1 min-w-0 h-full flex flex-col min-h-0"
        >
          <DigitalTwinCanvas
            projects={projects}
            activeProjectId={activeProjectId}
            highlightProjectSelect={highlightProjectSelect}
            allDevices={devices}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setHighlightProjectSelect(false);
            }}
            onOpenNewProjectModal={() => setNewProjectOpen(true)}
            onUpdateProjectPositions={(projectId, positions) => {
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === projectId ? { ...p, nodePositions: positions } : p
                )
              );
            }}
            onRemoveDeviceFromProject={(projectId, deviceId) => {
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === projectId
                    ? {
                        ...p,
                        syncedDeviceIds: p.syncedDeviceIds.filter(
                          (id) => id !== deviceId
                        ),
                      }
                    : p
                )
              );
            }}
            onClearProjectDevices={(projectId) => {
              setProjects((prev) =>
                prev.map((p) =>
                  p.id === projectId
                    ? { ...p, syncedDeviceIds: [], nodePositions: {} }
                    : p
                )
              );
            }}
            onToggleDeviceOnline={handleToggleDeviceOnline}
            onToggleDeviceCollecting={handleToggleDeviceCollecting}
            onToggleFan={handleToggleFan}
            onToggleLight={handleToggleLight}
            onBatchSetDevicesState={handleBatchSetDevicesState}
            onToggleRelayChannel={handleToggleRelayChannel}
            onOpenCameraMonitor={(cam) => setMonitorCameraId(cam.id)}
          />
        </section>
      </div>

      {/* Create New Simulation Project Modal */}
      {newProjectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="新建仿真项目"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF2F6]">
              <h3 className="text-[15px] font-bold text-[#0F172A]">
                新建仿真项目
              </h3>
              <button
                type="button"
                onClick={() => setNewProjectOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="p-5 space-y-4 text-[13px]"
            >
              <div>
                <label className="block font-medium text-[#334155] mb-1.5">
                  仿真项目名称
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="请输入仿真项目名称"
                  className="w-full rounded-xl border border-[#CBD5E1] px-3.5 py-2 focus:border-[#3D68F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#334155] mb-1.5">
                  场景分类
                </label>
                <select
                  value={newProjScene}
                  onChange={(e) => setNewProjScene(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 focus:border-[#3D68F5] focus:outline-none cursor-pointer"
                >
                  <option value="工业物联网 · 综合实训场景">
                    工业物联网 · 综合实训场景
                  </option>
                  <option value="智能制造 · 产线PLC与视觉联动">
                    智能制造 · 产线PLC与视觉联动
                  </option>
                  <option value="智慧安防 · 门禁与环境监控">
                    智慧安防 · 门禁与环境监控
                  </option>
                  <option value="智慧农业 · 温室传感器控制">
                    智慧农业 · 温室传感器控制
                  </option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(false)}
                  className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-1.5 text-[12.5px] font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Draggable Floating Camera Live Monitor Window (Left Default) */}
      <CameraLiveMonitorModal
        open={Boolean(monitorCamera)}
        camera={monitorCamera}
        allDevices={devices}
        onClose={() => setMonitorCameraId(null)}
      />
    </div>
  );
}
