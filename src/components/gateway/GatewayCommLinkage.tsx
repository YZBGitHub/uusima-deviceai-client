import {
  CheckCircle2,
  GitBranch,
  Play,
  Plus,
  Radio,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { GatewayDeviceItem, GatewayLinkageRule } from "../../types/gateway";

interface GatewayCommLinkageProps {
  devices: GatewayDeviceItem[];
  rules: GatewayLinkageRule[];
  onUpdateRules: (
    updater: (prev: GatewayLinkageRule[]) => GatewayLinkageRule[]
  ) => void;
  onTriggerRelayByRule: (ruleName: string) => void;
}

export function GatewayCommLinkage({
  devices,
  rules,
  onUpdateRules,
  onTriggerRelayByRule,
}: GatewayCommLinkageProps) {
  const [tab, setTab] = useState<"rules" | "buses">("rules");
  const [modalOpen, setModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [triggerDev, setTriggerDev] = useState(devices[1]?.name ?? "温度传感器模拟");
  const [condition, setCondition] = useState("> 30.0 ℃");
  const [actionCmd, setActionCmd] = useState("DO2 (新风排扇) -> 闭合 (ON)");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [serialPorts, setSerialPorts] = useState([
    { port: "COM1 (/dev/ttyS1)", baud: "9600", parity: "8N1", mode: "RS485 Modbus RTU", enabled: true },
    { port: "COM2 (/dev/ttyS2)", baud: "115200", parity: "8N1", mode: "RS485 透传 / PLC", enabled: true },
    { port: "TCP Server :5020", baud: "N/A", parity: "TCP", mode: "Modbus TCP 网关从站", enabled: true },
  ]);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleRule = (id: string) => {
    onUpdateRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleSimulateTrigger = (rule: GatewayLinkageRule) => {
    const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    onUpdateRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? { ...r, triggerCount: r.triggerCount + 1, lastTriggered: now }
          : r
      )
    );
    onTriggerRelayByRule(rule.name);
    notify(`已模拟触发规则「${rule.name}」，执行动作：${rule.actionCommand}`);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;
    const created: GatewayLinkageRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      description: `当 ${triggerDev} 满足 ${condition} 时执行 ${actionCmd}`,
      enabled: true,
      triggerDeviceName: triggerDev,
      triggerPoint: "temperature",
      condition,
      actionTarget: "四通道数字网络继电器控制器",
      actionCommand: actionCmd,
      triggerCount: 0,
      lastTriggered: "--",
    };
    onUpdateRules((prev) => [created, ...prev]);
    setRuleName("");
    setModalOpen(false);
    notify(`已创建并启用联动规则「${created.name}」`);
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#16A34A]" />
          <h2 className="text-[15px] font-bold text-[#111827]">
            通信总线与边缘联动规则引擎
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 max-w-full">
          <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-[12px] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setTab("rules")}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                tab === "rules"
                  ? "bg-[#16A34A] text-white"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              边缘联动规则 ({rules.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("buses")}
              className={`px-3 py-1.5 rounded-md font-medium cursor-pointer ${
                tab === "buses"
                  ? "bg-[#16A34A] text-white"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              串口与通信通道
            </button>
          </div>

          {tab === "rules" && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建规则</span>
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {tab === "rules" ? (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[14px] font-bold text-[#111827]">
                    {rule.name}
                  </span>
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                      rule.enabled
                        ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                        : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {rule.enabled ? "已启用" : "未启用"}
                  </span>
                </div>
                <p className="text-[12.5px] text-[#4B5563]">{rule.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11.5px] font-mono-tabular text-[#6B7280]">
                  <span>IF {rule.triggerPoint} {rule.condition}</span>
                  <span>→</span>
                  <span className="text-[#059669]">THEN {rule.actionCommand}</span>
                  <span>·</span>
                  <span>累计触发 {rule.triggerCount} 次</span>
                  <span>·</span>
                  <span>最近：{rule.lastTriggered}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateTrigger(rule)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 text-[12px] font-medium text-[#374151] cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>模拟触发</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleRule(rule.id)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer ${
                    rule.enabled
                      ? "bg-[#FEF3C7] text-[#B45309]"
                      : "bg-[#16A34A] text-white"
                  }`}
                >
                  {rule.enabled ? "停用" : "启用"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateRules((prev) => prev.filter((r) => r.id !== rule.id))
                  }
                  className="p-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          {/* Mobile Bus/Serial List (< md) */}
          <div className="md:hidden divide-y divide-[#F3F4F6]">
            {serialPorts.map((sp, idx) => (
              <div key={sp.port} className="p-3.5 space-y-2 text-[12.5px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-mono-tabular font-semibold text-[#111827]">
                    <Radio className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>{sp.port}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSerialPorts((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, enabled: !item.enabled } : item
                        )
                      )
                    }
                    className={`rounded border px-2.5 py-0.5 text-[11.5px] font-medium cursor-pointer shrink-0 ${
                      sp.enabled
                        ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                        : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {sp.enabled ? "已开启" : "已关闭"}
                  </button>
                </div>
                <div className="text-[12px] text-[#4B5563]">{sp.mode}</div>
                <div className="text-[11.5px] font-mono-tabular text-[#6B7280]">
                  波特率/协议：{sp.baud} · 校验：{sp.parity}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#374151] text-[12px]">
                  <th className="py-3 px-4 whitespace-nowrap">总线端口</th>
                  <th className="py-3 px-4 whitespace-nowrap">波特率 / 协议</th>
                  <th className="py-3 px-4 whitespace-nowrap">数据位/校验</th>
                  <th className="py-3 px-4 whitespace-nowrap">工作模式</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">状态控制</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {serialPorts.map((sp, idx) => (
                  <tr key={sp.port} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-mono-tabular font-semibold text-[#111827] whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-[#16A34A]" />
                        <span>{sp.port}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-tabular whitespace-nowrap">{sp.baud}</td>
                    <td className="py-3 px-4 font-mono-tabular whitespace-nowrap">{sp.parity}</td>
                    <td className="py-3 px-4">{sp.mode}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          setSerialPorts((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, enabled: !item.enabled } : item
                            )
                          )
                        }
                        className={`rounded border px-2.5 py-0.5 text-[11.5px] font-medium cursor-pointer ${
                          sp.enabled
                            ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                            : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                        }`}
                      >
                        {sp.enabled ? "已开启" : "已关闭"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[15px] font-bold text-[#111827]">
                新建边缘联动规则
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-5 space-y-3.5 text-[13px]">
              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  规则名称
                </label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="如：高温自动开启排风散热"
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 focus:border-[#16A34A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  触发源设备
                </label>
                <select
                  value={triggerDev}
                  onChange={(e) => setTriggerDev(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.deviceId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  触发阈值条件
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
                />
              </div>

              <div>
                <label className="block font-medium text-[#374151] mb-1">
                  执行联动动作
                </label>
                <input
                  type="text"
                  value={actionCmd}
                  onChange={(e) => setActionCmd(e.target.value)}
                  className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 font-mono-tabular"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-[#D1D5DB] px-4 py-1.5 text-[12.5px] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#16A34A] px-4 py-1.5 text-[12.5px] text-white cursor-pointer"
                >
                  保存并启用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
