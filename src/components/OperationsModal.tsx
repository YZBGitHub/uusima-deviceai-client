import { Activity, X } from "lucide-react";
import { DEVICES } from "../data/devices";
import type { ChatMessage } from "./AgentWorkspace";

interface OperationsModalProps {
  open: boolean;
  onClose: () => void;
  orgName: string;
  chatHistoryByDevice: Record<string, ChatMessage[]>;
}

export function OperationsModal({
  open,
  onClose,
  orgName,
  chatHistoryByDevice,
}: OperationsModalProps) {
  if (!open) return null;

  const systemCount = DEVICES.filter((d) => d.publisherType === "system").length;
  const userCount = DEVICES.filter((d) => d.publisherType === "user").length;
  const activeSessions = Object.values(chatHistoryByDevice).filter(
    (msgs) => msgs.length > 0
  ).length;
  const totalMessages = Object.values(chatHistoryByDevice).reduce(
    (sum, msgs) => sum + msgs.length,
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operations-modal-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#2563EB] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 id="operations-modal-title" className="text-[15px] font-bold text-[#0F172A]">
                平台运营概览
              </h2>
              <p className="text-[12px] text-[#64748B]">
                当前组织：{orgName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭平台运营"
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3">
              <div className="text-[11.5px] text-[#64748B]">智能体总数</div>
              <div className="mt-1 text-[20px] font-bold text-[#0F172A] font-mono-tabular">
                {DEVICES.length}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3">
              <div className="text-[11.5px] text-[#64748B]">系统发布</div>
              <div className="mt-1 text-[20px] font-bold text-[#3B66F5] font-mono-tabular">
                {systemCount}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3">
              <div className="text-[11.5px] text-[#64748B]">用户发布</div>
              <div className="mt-1 text-[20px] font-bold text-[#059669] font-mono-tabular">
                {userCount}
              </div>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3">
              <div className="text-[11.5px] text-[#64748B]">本次对话数</div>
              <div className="mt-1 text-[20px] font-bold text-[#0F172A] font-mono-tabular">
                {totalMessages}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-semibold text-[#1E293B]">
                设备智能体目录分布
              </h3>
              <span className="text-[11.5px] text-[#64748B] font-mono-tabular">
                活跃会话设备：{activeSessions} 台
              </span>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] max-h-60 overflow-y-auto">
              {DEVICES.map((device) => {
                const count = chatHistoryByDevice[device.id]?.length ?? 0;
                return (
                  <div
                    key={device.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-[12.5px]"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-medium shrink-0 ${
                          device.publisherType === "system"
                            ? "bg-[#EBF1FF] text-[#3B66F5]"
                            : "bg-[#ECFDF5] text-[#059669]"
                        }`}
                      >
                        {device.publisherType === "system" ? "系统" : "用户"}
                      </span>
                      <span className="font-medium text-[#1E293B] truncate">
                        {device.title}
                      </span>
                    </div>
                    <span className="text-[11.5px] text-[#64748B] font-mono-tabular shrink-0">
                      {count > 0 ? `${count} 条消息` : device.model}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
