import {
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface OrganizationItem {
  id: string;
  shortChar: string;
  name: string;
}

export const ORGANIZATIONS: OrganizationItem[] = [
  { id: "newland-edu", shortChar: "新", name: "新大陆教育行业云" },
  { id: "iiot-lab", shortChar: "工", name: "工业物联网实训中心" },
  { id: "smart-mfg", shortChar: "智", name: "智能制造研发实验室" },
];

interface UserMenuDropdownProps {
  userName: string;
  userPhone: string;
  activeOrg: OrganizationItem;
  onSelectOrg: (org: OrganizationItem) => void;
  onOpenProfile: () => void;
  onOpenSystemSettings: () => void;
  onOpenOperations: () => void;
  onLogout: () => void;
}

function BlueCardOrbitIllustration() {
  return (
    <svg
      viewBox="0 0 110 88"
      fill="none"
      className="pointer-events-none absolute right-2 bottom-1.5 w-[92px] h-[74px]"
      aria-hidden="true"
    >
      {/* Subtle circular platform shadow */}
      <ellipse cx="56" cy="74" rx="34" ry="8" fill="#1D4ED8" fillOpacity="0.35" />
      <ellipse cx="56" cy="70" rx="28" ry="6" fill="#93C5FD" fillOpacity="0.22" />

      {/* Back stacked translucent cards */}
      <rect
        x="46"
        y="14"
        width="36"
        height="36"
        rx="9"
        fill="#FFFFFF"
        fillOpacity="0.14"
      />
      <rect
        x="38"
        y="20"
        width="36"
        height="36"
        rx="9"
        fill="#FFFFFF"
        fillOpacity="0.22"
      />

      {/* Front translucent card */}
      <rect
        x="29"
        y="26"
        width="38"
        height="38"
        rx="10"
        fill="#93C5FD"
        fillOpacity="0.35"
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />

      {/* User silhouette */}
      <circle cx="48" cy="39.5" r="5" fill="#FFFFFF" />
      <path
        d="M38.5 55 C38.5 49.5 42.5 46.5 48 46.5 C53.5 46.5 57.5 49.5 57.5 55"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Orbital ring */}
      <ellipse
        cx="52"
        cy="47"
        rx="42"
        ry="15"
        transform="rotate(-14 52 47)"
        stroke="#FFFFFF"
        strokeOpacity="0.5"
        strokeWidth="1.2"
      />
      <circle cx="15" cy="54" r="2.2" fill="#E0F2FE" fillOpacity="0.85" />
      <circle cx="91" cy="39" r="1.8" fill="#FFFFFF" fillOpacity="0.7" />
    </svg>
  );
}

export function UserMenuDropdown({
  userName,
  userPhone,
  activeOrg,
  onSelectOrg,
  onOpenProfile,
  onOpenSystemSettings,
  onOpenOperations,
  onLogout,
}: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [showOrgList, setShowOrgList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowOrgList(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-5 shrink-0" ref={containerRef}>
      {/* Organization label trigger matching screenshot top bar */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setShowOrgList((prev) => (open ? !prev : true));
        }}
        className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-[#475569] hover:text-[#1E293B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <LayoutGrid className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={2} />
        <span>{activeOrg.name}</span>
      </button>

      {/* User name trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setShowOrgList(false);
        }}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 py-1 px-1.5 rounded-lg transition-colors cursor-pointer text-[13px] font-medium whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB] ${
          open
            ? "text-[#2563EB]"
            : "text-[#334155] hover:text-[#1E293B] hover:bg-white/60"
        }`}
      >
        <span>{userName}</span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.2} />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" strokeWidth={2.2} />
        )}
      </button>

      {/* Dropdown menu matching screenshot */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2.5 w-[276px] rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] z-50"
          role="menu"
        >
          {/* Blue gradient header banner */}
          <div
            className="relative rounded-[12px] p-4 overflow-hidden select-none"
            style={{
              background:
                "linear-gradient(135deg, #4B94FF 0%, #266BF4 100%)",
            }}
          >
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center text-white text-[17px] font-medium">
                {userName.slice(0, 1)}
              </div>
              <div className="mt-2.5 text-[15px] font-bold text-white leading-snug">
                {userName}
              </div>
              <div className="mt-0.5 text-[12px] text-white/85 font-mono-tabular tracking-wide">
                {userPhone}
              </div>
            </div>
            <BlueCardOrbitIllustration />
          </div>

          {/* Menu list rows */}
          <div className="mt-2.5 space-y-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenProfile();
              }}
              className="w-full rounded-[11px] border border-[#EDF2F7] bg-white hover:bg-[#F1F5FF] hover:border-[#D4E2FD] px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#1E293B]">
                <User className="w-4 h-4 text-[#2563EB]" strokeWidth={1.9} />
                <span>个人设置</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenSystemSettings();
              }}
              className="w-full rounded-[11px] border border-[#EDF2F7] bg-white hover:bg-[#F1F5FF] hover:border-[#D4E2FD] px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#1E293B]">
                <Settings className="w-4 h-4 text-[#2563EB]" strokeWidth={1.9} />
                <span>系统管理</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenOperations();
              }}
              className="w-full rounded-[11px] border border-[#EDF2F7] bg-white hover:bg-[#F1F5FF] hover:border-[#D4E2FD] px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#1E293B]">
                <Activity className="w-4 h-4 text-[#2563EB]" strokeWidth={1.9} />
                <span>平台运营</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full rounded-[11px] border border-[#EDF2F7] bg-white hover:bg-[#FEF2F2] hover:border-[#FECACA] px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#EF4444]">
                <LogOut className="w-4 h-4 text-[#EF4444]" strokeWidth={1.9} />
                <span>退出登录</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            </button>
          </div>

          {/* Organization section */}
          <div className="mt-3">
            <div className="px-1 mb-1.5 text-[11.5px] text-[#64748B]">组织</div>
            <div className="rounded-[11px] border border-[#EDF2F7] bg-white overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-[#2563EB] text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                    {activeOrg.shortChar}
                  </span>
                  <span className="text-[12.5px] font-medium text-[#1E293B] truncate">
                    {activeOrg.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrgList((v) => !v)}
                  className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>切换</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      showOrgList ? "rotate-90" : ""
                    }`}
                  />
                </button>
              </div>

              {showOrgList && (
                <div className="border-t border-[#F1F5F9] bg-[#F8FAFF] p-1.5 space-y-1">
                  {ORGANIZATIONS.map((org) => {
                    const selected = org.id === activeOrg.id;
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          onSelectOrg(org);
                          setShowOrgList(false);
                        }}
                        className={`w-full rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[12px] transition-colors cursor-pointer ${
                          selected
                            ? "bg-[#EEF2FF] text-[#2563EB] font-medium"
                            : "text-[#334155] hover:bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded bg-[#2563EB]/90 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                            {org.shortChar}
                          </span>
                          <span className="truncate">{org.name}</span>
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
