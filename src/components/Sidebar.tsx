import {
  Activity,
  Boxes,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cloud,
  Database,
  Eye,
  GitBranch,
  HardDrive,
  LayoutDashboard,
  Pin,
  Router,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GatewaySectionId } from "../types/gateway";

export type SidebarAction =
  | "agents"
  | "digital-twin"
  | GatewaySectionId
  | "settings"
  | "tools";

export const GATEWAY_USER_MENU: {
  id: GatewaySectionId;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "gw-dashboard", label: "仪表盘", icon: LayoutDashboard },
  { id: "gw-devices", label: "设备管理", icon: HardDrive },
  { id: "gw-data", label: "数据管理", icon: Database },
  { id: "gw-platform", label: "平台对接", icon: Cloud },
];

export const GATEWAY_SYSTEM_MENU: {
  id: GatewaySectionId;
  label: string;
  icon: typeof BrainCircuit;
}[] = [
  { id: "gw-ai-center", label: "智能中心", icon: BrainCircuit },
  { id: "gw-visualization", label: "可视化", icon: Eye },
  { id: "gw-comm-linkage", label: "通信与联动", icon: GitBranch },
  { id: "gw-ops-monitor", label: "运维监控", icon: Activity },
  { id: "gw-sys-config", label: "系统配置", icon: SlidersHorizontal },
  { id: "gw-security", label: "安全与维护", icon: ShieldCheck },
];

interface SidebarProps {
  expanded: boolean;
  onToggleExpand: () => void;
  activeView: SidebarAction;
  onSelectView: (view: SidebarAction) => void;
  pinnedQuickTools: boolean;
  onTogglePinTools: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function RobotMascotIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="4.5" r="2" fill="#FFFFFF" />
      <rect x="17" y="6" width="2" height="3.5" rx="1" fill="#FFFFFF" />
      <rect x="3.5" y="14" width="3" height="7" rx="1.5" fill="#E0E7FF" />
      <rect x="29.5" y="14" width="3" height="7" rx="1.5" fill="#E0E7FF" />
      <rect x="6.5" y="9" width="23" height="17" rx="5.5" fill="#FFFFFF" />
      <rect x="10" y="13.2" width="16" height="8" rx="3.5" fill="#3B34B8" />
      <circle cx="14.5" cy="17.2" r="1.7" fill="#A5F3FC" />
      <circle cx="21.5" cy="17.2" r="1.7" fill="#A5F3FC" />
      <path
        d="M12 27.5 C12 26.2 14.5 25.5 18 25.5 C21.5 25.5 24 26.2 24 27.5 L25.5 31 C25.5 31.8 24.8 32.5 24 32.5 H12 C11.2 32.5 10.5 31.8 10.5 31 L12 27.5 Z"
        fill="#E0E7FF"
      />
    </svg>
  );
}

export function Sidebar({
  expanded,
  onToggleExpand,
  activeView,
  onSelectView,
  pinnedQuickTools,
  onTogglePinTools,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [gatewaySubmenuOpen, setGatewaySubmenuOpen] = useState(true);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const gatewayRef = useRef<HTMLDivElement>(null);

  const isGatewayActive = activeView.startsWith("gw-");

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        gatewayRef.current &&
        !gatewayRef.current.contains(event.target as Node)
      ) {
        setFlyoutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const handleSelect = (view: SidebarAction) => {
    setFlyoutOpen(false);
    onSelectView(view);
    onCloseMobile?.();
  };

  return (
    <>
      <aside
        className={`hidden lg:flex relative z-30 shrink-0 flex-col justify-between select-none transition-[width] duration-200 ease-out ${
          expanded ? "w-[228px]" : "w-[50px]"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #544BE4 0%, #6862E7 52%, #7D83ED 100%)",
        }}
      >
      {/* Top navigation group */}
      <div className="flex flex-col items-stretch pt-3.5 px-1.5 gap-1.5 min-h-0 flex-1 overflow-y-auto overflow-x-visible">
        {/* Brand Robot Icon / 设备智能体 */}
        <button
          type="button"
          onClick={() => {
            setFlyoutOpen(false);
            onSelectView("agents");
          }}
          title="设备智能体"
          className={`group flex items-center gap-3 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white shrink-0 ${
            expanded
              ? "px-3 py-2 hover:bg-white/15"
              : "justify-center py-1.5 hover:bg-white/12"
          } ${activeView === "agents" ? (expanded ? "bg-white/18" : "bg-white/12") : ""}`}
        >
          <RobotMascotIcon className="w-7 h-7 shrink-0" />
          {expanded && (
            <span className="text-[13.5px] font-semibold text-white whitespace-nowrap">
              设备智能体
            </span>
          )}
        </button>

        {/* AI边缘网关 (Parent Menu with 用户端 + 系统端 grouped submenus) */}
        <div className="relative" ref={gatewayRef}>
          <button
            type="button"
            onClick={() => {
              if (expanded) {
                setGatewaySubmenuOpen((v) => !v);
              } else {
                setFlyoutOpen((v) => !v);
              }
            }}
            title="AI边缘网关"
            aria-expanded={expanded ? gatewaySubmenuOpen : flyoutOpen}
            className={`w-full group flex items-center justify-between rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
              expanded
                ? "px-3.5 py-2.5 text-white/95 hover:bg-white/15"
                : "justify-center py-2 text-white/85 hover:text-white hover:bg-white/12"
            } ${isGatewayActive ? "bg-white/18 text-white" : ""}`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Router className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
              {expanded && (
                <span className="text-[13px] font-medium whitespace-nowrap">
                  AI边缘网关
                </span>
              )}
            </span>
            {expanded &&
              (gatewaySubmenuOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
              ))}
          </button>

          {/* Inline grouped submenu when expanded */}
          {expanded && gatewaySubmenuOpen && (
            <div className="mt-1.5 ml-2 pl-2.5 border-l border-white/20 space-y-2.5 pb-1">
              {/* 用户端 */}
              <div>
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-white/60 tracking-wide">
                  用户端
                </div>
                <div className="space-y-0.5">
                  {GATEWAY_USER_MENU.map((item) => {
                    const Icon = item.icon;
                    const active = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectView(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? "bg-white/24 text-white font-semibold shadow-2xs"
                            : "text-white/80 hover:text-white hover:bg-white/12"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.9} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 系统端 */}
              <div>
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-white/60 tracking-wide">
                  系统端
                </div>
                <div className="space-y-0.5">
                  {GATEWAY_SYSTEM_MENU.map((item) => {
                    const Icon = item.icon;
                    const active = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectView(item.id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? "bg-white/24 text-white font-semibold shadow-2xs"
                            : "text-white/80 hover:text-white hover:bg-white/12"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.9} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Flyout grouped submenu when collapsed */}
          {!expanded && flyoutOpen && (
            <div className="fixed left-[56px] top-[58px] w-[288px] rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[0_14px_38px_rgba(15,23,42,0.16)] z-50">
              <div className="px-1 pb-2 mb-2 text-[12px] font-bold text-[#0F172A] border-b border-[#F1F5F9] flex items-center justify-between">
                <span>AI边缘网关</span>
                <span className="text-[11px] font-normal text-[#64748B]">功能导航</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-[#64748B]">
                    用户端
                  </div>
                  <div className="space-y-0.5">
                    {GATEWAY_USER_MENU.map((item) => {
                      const Icon = item.icon;
                      const active = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFlyoutOpen(false);
                            onSelectView(item.id);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? "bg-[#ECFDF5] text-[#059669] font-semibold"
                              : "text-[#334155] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="px-2 pb-1 text-[11px] font-semibold text-[#64748B]">
                    系统端
                  </div>
                  <div className="space-y-0.5">
                    {GATEWAY_SYSTEM_MENU.map((item) => {
                      const Icon = item.icon;
                      const active = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFlyoutOpen(false);
                            onSelectView(item.id);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? "bg-[#ECFDF5] text-[#059669] font-semibold"
                              : "text-[#334155] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 数字孪生 (Digital Twin) between AI边缘网关 and 系统设置 */}
        <button
          type="button"
          onClick={() => {
            setFlyoutOpen(false);
            onSelectView("digital-twin");
          }}
          title="数字孪生"
          className={`group flex items-center gap-3 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white shrink-0 ${
            expanded
              ? "px-3.5 py-2.5 text-white/95 hover:bg-white/15"
              : "justify-center py-2 text-white/85 hover:text-white hover:bg-white/12"
          } ${activeView === "digital-twin" ? "bg-white/22 text-white font-semibold" : ""}`}
        >
          <Boxes className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
          {expanded && (
            <span className="text-[13px] font-medium whitespace-nowrap">
              数字孪生
            </span>
          )}
        </button>

        {/* Settings Gear */}
        <button
          type="button"
          onClick={() => {
            setFlyoutOpen(false);
            onSelectView("settings");
          }}
          title="系统设置"
          className={`group flex items-center gap-3 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white shrink-0 ${
            expanded
              ? "px-3.5 py-2.5 text-white/90 hover:bg-white/15"
              : "justify-center py-2 text-white/85 hover:text-white hover:bg-white/12"
          } ${activeView === "settings" ? "bg-white/18 text-white" : ""}`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
          {expanded && (
            <span className="text-[13px] font-medium whitespace-nowrap">
              系统设置
            </span>
          )}
        </button>
      </div>

      {/* Center protruding collapse/expand pill tab */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-label={expanded ? "收起侧边栏" : "展开侧边栏"}
        title={expanded ? "收起导航" : "展开导航"}
        className="absolute top-1/2 -translate-y-1/2 -right-[13px] w-[14px] h-[34px] rounded-r-full bg-[#A5A6F6]/85 hover:bg-[#8E90F5] text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#3D68F5]"
      >
        {expanded ? (
          <ChevronsLeft className="w-3 h-3" strokeWidth={2.5} />
        ) : (
          <ChevronsRight className="w-3 h-3" strokeWidth={2.5} />
        )}
      </button>

      {/* Bottom pin / debug tools icon */}
      <div className="pb-4 pt-2 px-1.5 flex flex-col items-stretch gap-1 shrink-0">
        <button
          type="button"
          onClick={() => {
            onTogglePinTools();
            handleSelect("tools");
          }}
          title="通讯调试工具 (CRC16 / Hex)"
          className={`flex items-center gap-3 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
            expanded
              ? "px-3.5 py-2 text-white/85 hover:bg-white/15"
              : "justify-center py-2 text-white/85 hover:text-white hover:bg-white/12"
          }`}
        >
          <Pin
            className={`w-[16px] h-[16px] shrink-0 transition-transform ${
              pinnedQuickTools ? "rotate-0 text-white" : "rotate-45 text-white/85"
            }`}
            strokeWidth={1.9}
          />
          {expanded && (
            <span className="text-[12.5px] font-medium whitespace-nowrap">
              调试工具箱
            </span>
          )}
        </button>
      </div>
    </aside>

    {/* Mobile / Tablet Slide-over Navigation Drawer */}
    {mobileOpen && (
      <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="主导航菜单">
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          onClick={() => onCloseMobile?.()}
        />
        <aside
          className="relative z-10 w-[264px] max-w-[82vw] h-full flex flex-col justify-between select-none shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, #544BE4 0%, #6862E7 52%, #7D83ED 100%)",
          }}
        >
          <div className="flex flex-col items-stretch pt-3.5 px-2 gap-1.5 min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/15">
              <button
                type="button"
                onClick={() => handleSelect("agents")}
                className="flex items-center gap-2.5 text-left cursor-pointer"
              >
                <RobotMascotIcon className="w-7 h-7 shrink-0" />
                <span className="text-[14px] font-semibold text-white whitespace-nowrap">
                  设备智能体
                </span>
              </button>
              <button
                type="button"
                onClick={() => onCloseMobile?.()}
                aria-label="关闭导航菜单"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelect("agents")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeView === "agents"
                  ? "bg-white/22 text-white font-semibold"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              <RobotMascotIcon className="w-5 h-5 shrink-0" />
              <span>智能体广场</span>
            </button>

            <div>
              <button
                type="button"
                onClick={() => setGatewaySubmenuOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  isGatewayActive ? "bg-white/18 text-white" : "text-white/95 hover:bg-white/15"
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Router className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    AI边缘网关
                  </span>
                </span>
                {gatewaySubmenuOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />
                )}
              </button>

              {gatewaySubmenuOpen && (
                <div className="mt-1.5 ml-2 pl-2.5 border-l border-white/20 space-y-2.5 pb-1">
                  <div>
                    <div className="px-2.5 pb-1 text-[11px] font-semibold text-white/60 tracking-wide">
                      用户端
                    </div>
                    <div className="space-y-0.5">
                      {GATEWAY_USER_MENU.map((item) => {
                        const Icon = item.icon;
                        const active = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                              active
                                ? "bg-white/24 text-white font-semibold shadow-2xs"
                                : "text-white/85 hover:text-white hover:bg-white/12"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="px-2.5 pb-1 text-[11px] font-semibold text-white/60 tracking-wide">
                      系统端
                    </div>
                    <div className="space-y-0.5">
                      {GATEWAY_SYSTEM_MENU.map((item) => {
                        const Icon = item.icon;
                        const active = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                              active
                                ? "bg-white/24 text-white font-semibold shadow-2xs"
                                : "text-white/85 hover:text-white hover:bg-white/12"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSelect("digital-twin")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeView === "digital-twin"
                  ? "bg-white/22 text-white font-semibold"
                  : "text-white/95 hover:bg-white/15"
              }`}
            >
              <Boxes className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
              <span>数字孪生</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelect("settings")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeView === "settings"
                  ? "bg-white/18 text-white"
                  : "text-white/90 hover:bg-white/15"
              }`}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={1.9} />
              <span>系统设置</span>
            </button>
          </div>

          <div className="pb-4 pt-2 px-2 border-t border-white/15 shrink-0">
            <button
              type="button"
              onClick={() => {
                onTogglePinTools();
                handleSelect("tools");
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-white/90 hover:bg-white/15 transition-colors cursor-pointer"
            >
              <Pin
                className={`w-[16px] h-[16px] shrink-0 transition-transform ${
                  pinnedQuickTools ? "rotate-0 text-white" : "rotate-45 text-white/85"
                }`}
                strokeWidth={1.9}
              />
              <span>调试工具箱</span>
            </button>
          </div>
        </aside>
      </div>
    )}
    </>
  );
}
