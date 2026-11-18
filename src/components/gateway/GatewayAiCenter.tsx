import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Play,
  Sliders,
  Sparkles,
  Square,
} from "lucide-react";
import { useState } from "react";
import type { GatewayAiEngineItem } from "../../types/gateway";

interface GatewayAiCenterProps {
  engines: GatewayAiEngineItem[];
  onUpdateEngines: (
    updater: (prev: GatewayAiEngineItem[]) => GatewayAiEngineItem[]
  ) => void;
  onOpenAssistant: () => void;
}

export function GatewayAiCenter({
  engines,
  onUpdateEngines,
  onOpenAssistant,
}: GatewayAiCenterProps) {
  const [testResult, setTestResult] = useState<string | null>(null);

  const runningCount = engines.filter((e) => e.status === "running").length;
  const avgNpu = Math.round(
    engines.reduce((acc, e) => acc + (e.status === "running" ? e.npuUsage : 0), 0)
  );

  const handleToggleEngine = (id: string) => {
    onUpdateEngines((prev) =>
      prev.map((eng) =>
        eng.id === id
          ? {
              ...eng,
              status: eng.status === "running" ? "stopped" : "running",
            }
          : eng
      )
    );
  };

  const handleThresholdChange = (id: string, val: number) => {
    onUpdateEngines((prev) =>
      prev.map((eng) =>
        eng.id === id ? { ...eng, confidenceThreshold: val } : eng
      )
    );
  };

  const handleRunSampleInference = (engine: GatewayAiEngineItem) => {
    const score = (0.91 + Math.random() * 0.08).toFixed(3);
    const latency = (12 + Math.random() * 8).toFixed(1);
    setTestResult(
      `引擎「${engine.name}」实时采样推理完成：置信度 ${score} (阈值 ${engine.confidenceThreshold.toFixed(2)})，边缘 NPU 耗时 ${latency}ms，判定结果正常。`
    );
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#111827]">
            边缘 AI 智能推理中心
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6B7280]">
            管理本地 ONNX / TFLite 推理引擎、调节置信度阈值并监控边缘 NPU 算力负载
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAssistant}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 text-[12.5px] font-medium text-white cursor-pointer whitespace-nowrap"
        >
          <Bot className="w-4 h-4" />
          <span>打开 AI 网关工程助手</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] text-[#6B7280]">运行中推理引擎</div>
            <div className="text-[22px] font-bold text-[#111827] font-mono-tabular">
              {runningCount} / {engines.length}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] text-[#6B7280]">边缘 NPU 总负载</div>
            <div className="text-[22px] font-bold text-[#111827] font-mono-tabular">
              {avgNpu}%
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[12px] text-[#6B7280]">边缘推理运行时</div>
            <div className="text-[15px] font-bold text-[#111827] font-mono-tabular mt-0.5">
              TensorRT 8.6 + ONNX
            </div>
          </div>
        </div>
      </div>

      {testResult && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2.5 text-[12.5px] text-[#065F46] flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testResult}</span>
          </span>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-[12px] hover:underline cursor-pointer"
          >
            关闭
          </button>
        </div>
      )}

      {/* Engines List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {engines.map((eng) => (
          <div
            key={eng.id}
            className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827]">
                    {eng.name}
                  </h3>
                  <div className="mt-0.5 text-[11.5px] text-[#6B7280] font-mono-tabular">
                    {eng.framework} · {eng.version}
                  </div>
                </div>
                <span
                  className={`rounded border px-2 py-0.5 text-[11px] font-medium shrink-0 ${
                    eng.status === "running"
                      ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                      : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                  }`}
                >
                  {eng.status === "running" ? "运行中" : "已停止"}
                </span>
              </div>

              <div className="space-y-1.5 text-[12px] text-[#4B5563]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">任务类型</span>
                  <span className="font-medium text-[#111827]">{eng.taskType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">绑定设备</span>
                  <span className="font-mono-tabular text-[#111827] truncate max-w-[180px]">
                    {eng.targetDevices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">吞吐 / 延迟</span>
                  <span className="font-mono-tabular text-[#111827]">
                    {eng.fpsOrRate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">NPU 占用</span>
                  <span className="font-mono-tabular text-[#111827]">
                    {eng.status === "running" ? `${eng.npuUsage}%` : "0%"}
                  </span>
                </div>
              </div>

              {/* Confidence Slider */}
              <div className="pt-2 border-t border-[#F3F4F6]">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="inline-flex items-center gap-1 text-[#4B5563]">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>置信度阈值</span>
                  </span>
                  <span className="font-mono-tabular font-semibold text-[#16A34A]">
                    {eng.confidenceThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={eng.confidenceThreshold}
                  onChange={(e) =>
                    handleThresholdChange(eng.id, Number(e.target.value))
                  }
                  className="w-full accent-[#16A34A] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleToggleEngine(eng.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium cursor-pointer transition-colors ${
                  eng.status === "running"
                    ? "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]"
                    : "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A] hover:bg-[#D1FAE5]"
                }`}
              >
                {eng.status === "running" ? (
                  <>
                    <Square className="w-3 h-3" />
                    <span>停止引擎</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>启动引擎</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRunSampleInference(eng)}
                className="rounded-lg bg-[#16A34A] hover:bg-[#15803D] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer"
              >
                单帧推理测试
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
