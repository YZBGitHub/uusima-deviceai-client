import { Bot, GripVertical, LogIn, Menu, RotateCcw, Search, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AgentWorkspace,
  type AgentPreferences,
  type ChatMessage,
} from "./components/AgentWorkspace";
import { BackgroundCanvas } from "./components/BackgroundCanvas";
import { DeviceCard } from "./components/DeviceCard";
import { DigitalTwinWorkspace } from "./components/DigitalTwinWorkspace";
import { GatewayAssistantModal } from "./components/GatewayAssistantModal";
import { GatewayCloudConfig } from "./components/GatewayCloudConfig";
import { GatewayDeviceManagement } from "./components/GatewayDeviceManagement";
import { GatewayAiCenter } from "./components/gateway/GatewayAiCenter";
import { GatewayCommLinkage } from "./components/gateway/GatewayCommLinkage";
import { GatewayDashboard } from "./components/gateway/GatewayDashboard";
import { GatewayDataManagement } from "./components/gateway/GatewayDataManagement";
import { GatewayOpsMonitor } from "./components/gateway/GatewayOpsMonitor";
import { GatewaySecurity } from "./components/gateway/GatewaySecurity";
import { GatewaySysConfig } from "./components/gateway/GatewaySysConfig";
import { GatewayVisualization } from "./components/gateway/GatewayVisualization";
import { IotDisplayFrame } from "./components/IotDisplayFrame";
import { LanAccessBanner } from "./components/LanAccessBanner";
import { OperationsModal } from "./components/OperationsModal";
import { Pagination } from "./components/Pagination";
import { ProfileModal } from "./components/ProfileModal";
import { SettingsModal } from "./components/SettingsModal";
import {
  GATEWAY_SYSTEM_MENU,
  GATEWAY_USER_MENU,
  Sidebar,
  type SidebarAction,
} from "./components/Sidebar";
import { ToolsModal } from "./components/ToolsModal";
import {
  ORGANIZATIONS,
  UserMenuDropdown,
  type OrganizationItem,
} from "./components/UserMenuDropdown";
import { DEVICES, type DeviceAgent } from "./data/devices";
import {
  INITIAL_AI_ENGINES,
  INITIAL_ALERTS,
  INITIAL_GATEWAY_DEVICES,
  INITIAL_LINKAGE_RULES,
  INITIAL_LOGS,
} from "./data/gatewayInitialData";
import type {
  GatewayAiEngineItem,
  GatewayAlertItem,
  GatewayDeviceItem,
  GatewayLinkageRule,
  GatewayLogEntry,
  GatewaySectionId,
} from "./types/gateway";

type PublisherFilter = "all" | "system" | "user";
type MainSection = "agents" | "digital-twin" | GatewaySectionId;

export default function App() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<MainSection>("agents");
  const [deviceProtocolPreFilter, setDeviceProtocolPreFilter] = useState<string>("all");
  const [activeDevice, setActiveDevice] = useState<DeviceAgent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [gatewayAssistantOpen, setGatewayAssistantOpen] = useState(false);
  const [assistantInitialMode, setAssistantInitialMode] = useState<
    "chat" | "import"
  >("chat");
  const [assistantOffset, setAssistantOffset] = useState({
    right: 24,
    bottom: 24,
  });
  const [isDraggingAssistant, setIsDraggingAssistant] = useState(false);
  const assistantBtnRef = useRef<HTMLButtonElement | null>(null);
  const screenViewportRef = useRef<HTMLDivElement | null>(null);
  const assistantJustDraggedRef = useRef(false);

  const getScreenBounds = () => ({
    width: screenViewportRef.current?.clientWidth ?? window.innerWidth,
    height: screenViewportRef.current?.clientHeight ?? window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      const rect = assistantBtnRef.current?.getBoundingClientRect();
      const width = rect?.width ?? 148;
      const height = rect?.height ?? 42;
      const bounds = getScreenBounds();
      setAssistantOffset((prev) => ({
        right: Math.min(
          Math.max(12, prev.right),
          Math.max(12, bounds.width - width - 12)
        ),
        bottom: Math.min(
          Math.max(12, prev.bottom),
          Math.max(12, bounds.height - height - 12)
        ),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAssistantPointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startRight = assistantOffset.right;
    const startBottom = assistantOffset.bottom;
    let moved = false;
    assistantJustDraggedRef.current = false;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 4) {
        moved = true;
        assistantJustDraggedRef.current = true;
        setIsDraggingAssistant(true);
      }
      if (!moved) return;

      const bounds = getScreenBounds();
      const maxRight = Math.max(12, bounds.width - rect.width - 12);
      const maxBottom = Math.max(12, bounds.height - rect.height - 12);
      const nextRight = Math.min(Math.max(12, startRight - dx), maxRight);
      const nextBottom = Math.min(Math.max(12, startBottom - dy), maxBottom);
      setAssistantOffset({ right: nextRight, bottom: nextBottom });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      setIsDraggingAssistant(false);
      if (moved) {
        window.setTimeout(() => {
          assistantJustDraggedRef.current = false;
        }, 0);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Shared live gateway state across all 10 sub-modules
  const [gatewayDevices, setGatewayDevices] = useState<GatewayDeviceItem[]>(
    INITIAL_GATEWAY_DEVICES
  );
  const [linkageRules, setLinkageRules] = useState<GatewayLinkageRule[]>(
    INITIAL_LINKAGE_RULES
  );
  const [alerts, setAlerts] = useState<GatewayAlertItem[]>(INITIAL_ALERTS);
  const [aiEngines, setAiEngines] = useState<GatewayAiEngineItem[]>(
    INITIAL_AI_ENGINES
  );
  const [logs, setLogs] = useState<GatewayLogEntry[]>(INITIAL_LOGS);

  const [pinnedQuickTools, setPinnedQuickTools] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  const [publisherFilter, setPublisherFilter] = useState<PublisherFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [userName, setUserName] = useState("杨振邦");
  const [userPhone, setUserPhone] = useState("15396005420");
  const [activeOrg, setActiveOrg] = useState<OrganizationItem>(ORGANIZATIONS[0]);

  const [preferences, setPreferences] = useState<AgentPreferences>({
    baudRate: "115200",
    codeLanguage: "Python",
    detailLevel: "detailed",
  });

  const [chatHistoryByDevice, setChatHistoryByDevice] = useState<
    Record<string, ChatMessage[]>
  >({});

  const systemCount = useMemo(
    () => DEVICES.filter((d) => d.publisherType === "system").length,
    []
  );
  const userCount = useMemo(
    () => DEVICES.filter((d) => d.publisherType === "user").length,
    []
  );

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return DEVICES.filter((device) => {
      if (
        publisherFilter !== "all" &&
        device.publisherType !== publisherFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        device.title.toLowerCase().includes(q) ||
        device.subtitle.toLowerCase().includes(q) ||
        device.model.toLowerCase().includes(q) ||
        device.vendor.toLowerCase().includes(q) ||
        device.category.toLowerCase().includes(q) ||
        device.protocols.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [publisherFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredDevices.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDevices = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredDevices.slice(start, start + pageSize);
  }, [filteredDevices, safeCurrentPage, pageSize]);

  const handleSidebarSelect = (view: SidebarAction) => {
    if (view === "agents" || view === "digital-twin" || view.startsWith("gw-")) {
      setActiveSection(view as MainSection);
      if (view !== "gw-devices") setDeviceProtocolPreFilter("all");
      setActiveDevice(null);
      setSettingsOpen(false);
      setToolsOpen(false);
      setProfileOpen(false);
      setOperationsOpen(false);
    } else if (view === "settings") {
      setSettingsOpen(true);
    } else if (view === "tools") {
      setToolsOpen(true);
    }
  };

  const handleUpdateMessages = (deviceId: string, messages: ChatMessage[]) => {
    setChatHistoryByDevice((prev) => ({
      ...prev,
      [deviceId]: messages,
    }));
  };

  const handleTriggerRelayByRule = (ruleName: string) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setGatewayDevices((prev) =>
      prev.map((d) => {
        if (d.category === "fan") {
          return {
            ...d,
            status: "online",
            collecting: true,
            fanRunning: true,
            lastUpdate: now,
          };
        }
        if (d.modbusType === "relay" && d.relayChannels) {
          return {
            ...d,
            lastUpdate: now,
            relayChannels: d.relayChannels.map((ch) =>
              ch.channel === "DO2" ? { ...ch, isOn: true } : ch
            ),
          };
        }
        return d;
      })
    );
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: `${now}.088`,
        level: "INFO",
        module: "linkage.engine",
        message: `rule="${ruleName}" triggered fan & relay -> ON`,
      },
      ...prev,
    ]);
  };

  const activeView: SidebarAction = settingsOpen
    ? "settings"
    : toolsOpen
      ? "tools"
      : activeSection;

  const isGatewaySection = activeSection.startsWith("gw-");

  const headerTitle = useMemo(() => {
    if (activeSection === "digital-twin") return "数字孪生";
    if (activeSection === "agents") {
      return activeDevice ? activeDevice.title : "设备智能体";
    }
    const gwMenuMatch = [...GATEWAY_USER_MENU, ...GATEWAY_SYSTEM_MENU].find(
      (item) => item.id === activeSection
    );
    return gwMenuMatch ? `AI边缘网关 · ${gwMenuMatch.label}` : "AI边缘网关";
  }, [activeSection, activeDevice]);

  const handleHardwareHome = () => {
    if (loggedOut) {
      setLoggedOut(false);
      return;
    }
    handleSidebarSelect("agents");
  };

  if (loggedOut) {
    return (
      <IotDisplayFrame
        screenRef={screenViewportRef}
        onHomeClick={handleHardwareHome}
      >
        <div className="relative h-full w-full flex items-center justify-center bg-[#F8FAFF] p-6 overflow-y-auto">
          <BackgroundCanvas />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-7 text-center shadow-[0_14px_38px_rgba(37,99,235,0.1)]">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#2563EB] text-white text-[18px] font-semibold flex items-center justify-center">
              {userName.slice(0, 1)}
            </div>
            <h1 className="mt-4 text-[17px] font-bold text-[#0F172A]">
              已安全退出登录
            </h1>
            <p className="mt-1.5 text-[13px] text-[#64748B]">
              当前账号：{userName}（{activeOrg.name}）
            </p>
            <button
              type="button"
              onClick={() => setLoggedOut(false)}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-2.5 px-4 text-[13.5px] font-medium text-white transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>重新登录设备智能体平台</span>
            </button>
          </div>
        </div>
      </IotDisplayFrame>
    );
  }

  return (
    <IotDisplayFrame
      screenRef={screenViewportRef}
      onHomeClick={handleHardwareHome}
    >
      <div className="relative h-full w-full flex overflow-hidden bg-[#F5F7FA] text-[#1E293B]">
        {!isGatewaySection && <BackgroundCanvas />}

        {/* Left vertical purple-blue gradient sidebar */}
        <Sidebar
          expanded={sidebarExpanded}
          onToggleExpand={() => setSidebarExpanded((v) => !v)}
          activeView={activeView}
          onSelectView={handleSidebarSelect}
          pinnedQuickTools={pinnedQuickTools}
          onTogglePinTools={() => setPinnedQuickTools((v) => !v)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="relative z-10 flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          {/* Top bar — IP banner always visible on all pages & screen widths */}
          <header className="shrink-0 px-3 sm:px-5 md:px-6 pt-3 pb-2.5 border-b border-[#E5E7EB]/80 bg-white/85 backdrop-blur-xs grid grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2">
            <div className="min-w-0 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="打开导航菜单"
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] shrink-0 cursor-pointer"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-[16px] sm:text-[18px] font-bold text-[#1E293B] tracking-tight leading-snug truncate">
                  {headerTitle}
                </h1>
                {activeSection === "agents" && !activeDevice && (
                  <p className="hidden sm:block text-[11.5px] text-[#64748B] leading-normal truncate">
                    选择并启动您需要的智能体
                  </p>
                )}
              </div>
            </div>

            <div className="col-span-2 xl:col-span-1 order-3 xl:order-2 justify-self-stretch xl:justify-self-center flex justify-center min-w-0">
              <LanAccessBanner />
            </div>

            <div className="order-2 xl:order-3 justify-self-end flex items-center gap-2 sm:gap-4 shrink-0">
              <UserMenuDropdown
                userName={userName}
                userPhone={userPhone}
                activeOrg={activeOrg}
                onSelectOrg={setActiveOrg}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenSystemSettings={() => setSettingsOpen(true)}
                onOpenOperations={() => setOperationsOpen(true)}
                onLogout={() => setLoggedOut(true)}
              />
            </div>
          </header>

          {/* Main workspace viewport */}
          <main
            className={`flex-1 min-h-0 flex flex-col px-3 sm:px-5 md:px-6 pt-3.5 sm:pt-4 pb-5 ${
              activeSection === "digital-twin"
                ? "overflow-y-auto lg:overflow-hidden"
                : "overflow-y-auto"
            }`}
          >
          {activeSection === "gw-dashboard" ? (
            <GatewayDashboard
              devices={gatewayDevices}
              rules={linkageRules}
              alerts={alerts}
              aiEngines={aiEngines}
              onNavigate={(section, protoFilter) => {
                if (protoFilter) setDeviceProtocolPreFilter(protoFilter);
                else setDeviceProtocolPreFilter("all");
                setActiveSection(section);
              }}
            />
          ) : activeSection === "gw-devices" ? (
            <GatewayDeviceManagement
              devices={gatewayDevices}
              initialProtocolFilter={deviceProtocolPreFilter}
              accountName={userName}
              orgName={activeOrg.name}
              onAddDevices={(items) =>
                setGatewayDevices((prev) => [...items, ...prev])
              }
              onUpdateDevices={setGatewayDevices}
              onOpenAiImport={() => {
                setAssistantInitialMode("import");
                setGatewayAssistantOpen(true);
              }}
            />
          ) : activeSection === "gw-data" ? (
            <GatewayDataManagement devices={gatewayDevices} />
          ) : activeSection === "gw-platform" ? (
            <GatewayCloudConfig />
          ) : activeSection === "gw-ai-center" ? (
            <GatewayAiCenter
              engines={aiEngines}
              onUpdateEngines={setAiEngines}
              onOpenAssistant={() => {
                setAssistantInitialMode("chat");
                setGatewayAssistantOpen(true);
              }}
            />
          ) : activeSection === "gw-visualization" ? (
            <GatewayVisualization devices={gatewayDevices} />
          ) : activeSection === "gw-comm-linkage" ? (
            <GatewayCommLinkage
              devices={gatewayDevices}
              rules={linkageRules}
              onUpdateRules={setLinkageRules}
              onTriggerRelayByRule={handleTriggerRelayByRule}
            />
          ) : activeSection === "gw-ops-monitor" ? (
            <GatewayOpsMonitor
              alerts={alerts}
              onUpdateAlerts={setAlerts}
              logs={logs}
              onAppendLog={(entry) => setLogs((prev) => [entry, ...prev])}
            />
          ) : activeSection === "gw-sys-config" ? (
            <GatewaySysConfig />
          ) : activeSection === "gw-security" ? (
            <GatewaySecurity />
          ) : activeSection === "digital-twin" ? (
            <DigitalTwinWorkspace
              devices={gatewayDevices}
              onUpdateDevices={setGatewayDevices}
              accountName={userName}
              orgId={activeOrg.id}
              onLogEvent={(module, message) => {
                const now = new Date().toLocaleTimeString("zh-CN", {
                  hour12: false,
                });
                setLogs((prev) => [
                  {
                    id: `log-${Date.now()}`,
                    timestamp: `${now}.120`,
                    level: "INFO",
                    module,
                    message,
                  },
                  ...prev,
                ]);
              }}
            />
          ) : activeDevice ? (
            <AgentWorkspace
              device={activeDevice}
              preferences={preferences}
              messages={chatHistoryByDevice[activeDevice.id] ?? []}
              onUpdateMessages={handleUpdateMessages}
              onBack={() => setActiveDevice(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-6">
              <div>
                {/* Type filter & keyword search toolbar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div
                    role="tablist"
                    aria-label="智能体类型筛选"
                    className="inline-flex items-center gap-1 rounded-xl border border-[#DCE6FC] bg-white/80 p-1 shadow-[0_2px_10px_rgba(68,100,235,0.04)]"
                  >
                    {[
                      {
                        key: "all" as const,
                        label: `全部 (${DEVICES.length})`,
                      },
                      {
                        key: "system" as const,
                        label: `系统 (${systemCount})`,
                      },
                      {
                        key: "user" as const,
                        label: `用户 (${userCount})`,
                      },
                    ].map((tab) => {
                      const active = publisherFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => {
                            setPublisherFilter(tab.key);
                            setCurrentPage(1);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? "bg-[#3D68F5] text-white shadow-[0_2px_8px_rgba(61,104,245,0.25)]"
                              : "text-[#475569] hover:text-[#1E293B] hover:bg-[#F1F5FF]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative w-full sm:w-[290px] md:w-[320px]">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]"
                      strokeWidth={2}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="搜索智能体名称、型号、厂商或协议..."
                      aria-label="搜索设备智能体"
                      className="w-full rounded-xl border border-[#DCE6FC] bg-white/90 focus:bg-white focus:border-[#3D68F5] focus:outline-none pl-9 pr-8 py-2 text-[12.5px] text-[#1E293B] placeholder:text-[#94A3B8] shadow-[0_2px_10px_rgba(68,100,235,0.04)] transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setCurrentPage(1);
                        }}
                        aria-label="清空搜索关键字"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {paginatedDevices.length === 0 ? (
                  <div className="rounded-[16px] border border-[#E2EAFE] bg-white/85 py-16 px-6 text-center shadow-[0_4px_18px_rgba(68,100,235,0.04)]">
                    <p className="text-[14.5px] font-semibold text-[#1E293B]">
                      未找到符合条件的设备智能体
                    </p>
                    <p className="mt-1.5 text-[12.5px] text-[#64748B]">
                      尝试调整类型筛选或更换关键字（如 USR、Modbus、LoRa、PLC）
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPublisherFilter("all");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#3D68F5] hover:bg-[#2E56DE] px-4 py-1.5 text-[12.5px] font-medium text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>重置筛选条件</span>
                    </button>
                  </div>
                ) : (
                  <section
                    aria-label="设备智能体列表"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 xl:gap-5"
                  >
                    {paginatedDevices.map((device) => (
                      <DeviceCard
                        key={device.id}
                        device={device}
                        onLaunch={(selected) => setActiveDevice(selected)}
                      />
                    ))}
                  </section>
                )}
              </div>

              <div className="mt-auto pt-4">
                <Pagination
                  total={filteredDevices.length}
                  currentPage={safeCurrentPage}
                  pageSize={pageSize}
                  pageSizeOptions={[6, 12, 18, 24]}
                  onPageChange={(page) => setCurrentPage(page)}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <ToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        onChangePreferences={setPreferences}
        onClearAllHistory={() => {
          setChatHistoryByDevice({});
          setSettingsOpen(false);
        }}
      />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userName={userName}
        userPhone={userPhone}
        orgName={activeOrg.name}
        onSaveProfile={(nextName, nextPhone) => {
          setUserName(nextName);
          setUserPhone(nextPhone);
        }}
      />
      <OperationsModal
        open={operationsOpen}
        onClose={() => setOperationsOpen(false)}
        orgName={activeOrg.name}
        chatHistoryByDevice={chatHistoryByDevice}
      />

      {/* Bottom-right draggable AI智能助手 button always visible across all sidebar features */}
      <button
        ref={assistantBtnRef}
        type="button"
        title="点击打开 · 按住可拖动位置"
        onPointerDown={handleAssistantPointerDown}
        onClick={() => {
          if (assistantJustDraggedRef.current) return;
          setAssistantInitialMode("chat");
          setGatewayAssistantOpen(true);
        }}
        className={`fixed z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_28px_rgba(61,104,245,0.36)] touch-none select-none whitespace-nowrap ${
          isDraggingAssistant
            ? "cursor-grabbing scale-[1.03] shadow-[0_14px_34px_rgba(61,104,245,0.45)]"
            : "cursor-grab transition-transform duration-150 hover:-translate-y-0.5"
        }`}
        style={{
          right: `${assistantOffset.right}px`,
          bottom: `${assistantOffset.bottom}px`,
          background: "linear-gradient(135deg, #544BE4 0%, #3D68F5 100%)",
        }}
      >
        <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-75" />
        <Bot className="w-4 h-4 shrink-0" />
        <span>AI智能助手</span>
      </button>

        <GatewayAssistantModal
          open={gatewayAssistantOpen}
          initialMode={assistantInitialMode}
          onClose={() => setGatewayAssistantOpen(false)}
          contextSection={activeSection}
          preferences={preferences}
          onImportDevice={(device) => {
            setGatewayDevices((prev) => [device, ...prev]);
          }}
        />
      </div>
    </IotDisplayFrame>
  );
}
