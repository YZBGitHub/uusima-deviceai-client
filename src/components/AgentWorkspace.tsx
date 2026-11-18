import {
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DeviceAgent } from "../data/devices";

export interface AgentPreferences {
  baudRate: string;
  codeLanguage: string;
  detailLevel: "detailed" | "concise";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface AgentWorkspaceProps {
  device: DeviceAgent;
  preferences: AgentPreferences;
  messages: ChatMessage[];
  onUpdateMessages: (deviceId: string, messages: ChatMessage[]) => void;
  onBack: () => void;
}

function FormattedMessageText({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const segments = text.split(/(```[\s\S]*?```)/g);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1600);
  };

  return (
    <div className="space-y-2.5 text-[13.5px] leading-relaxed text-[#1E293B]">
      {segments.map((segment, idx) => {
        if (segment.startsWith("```") && segment.endsWith("```")) {
          const inner = segment.slice(3, -3);
          const firstNewline = inner.indexOf("\n");
          const lang = firstNewline > -1 ? inner.slice(0, firstNewline).trim() : "text";
          const code = firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;

          return (
            <div
              key={idx}
              className="rounded-lg border border-[#CBD5E1] bg-[#0F172A] text-[#E2E8F0] overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#1E293B] border-b border-[#334155] text-[11px] text-[#94A3B8]">
                <span className="font-mono-tabular uppercase">{lang || "code"}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(code.trim(), idx)}
                  className="inline-flex items-center gap-1 text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[12px] font-mono-tabular leading-5">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Render plain prose lines cleanly with inline code & bold emphasis
        const lines = segment.split("\n");
        return (
          <div key={idx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-1" />;

              // Simple inline code and bold parser
              const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
              return (
                <p key={lineIdx} className="whitespace-pre-wrap break-words">
                  {parts.map((part, pIdx) => {
                    if (part.startsWith("`") && part.endsWith("`")) {
                      return (
                        <code
                          key={pIdx}
                          className="mx-0.5 px-1.5 py-0.5 rounded bg-[#EEF2FF] text-[#3730A3] font-mono-tabular text-[12px]"
                        >
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return (
                        <strong key={pIdx} className="font-semibold text-[#0F172A]">
                          {part.slice(2, -2)}
                        </strong>
                      );
                    }
                    return <span key={pIdx}>{part}</span>;
                  })}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export function AgentWorkspace({
  device,
  preferences,
  messages,
  onUpdateMessages,
  onBack,
}: AgentWorkspaceProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSpecTab, setActiveSpecTab] = useState<"specs" | "commands">("specs");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const sendMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg(null);
    const nowTime = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: nowTime,
    };

    const assistantMsgId = `m-${Date.now() + 1}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "model",
      text: "",
      timestamp: nowTime,
    };

    const nextMessages = [...messages, userMsg, assistantMsg];
    onUpdateMessages(device.id, nextMessages);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: device.title,
          deviceModel: device.model,
          systemContext: device.systemContext,
          preferences,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
          message: trimmed,
        }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errData.error || `请求失败 (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法建立智能体数据流连接。");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;
          const payloadStr = line.slice(5).trim();
          if (!payloadStr) continue;

          try {
            const payload = JSON.parse(payloadStr) as {
              text?: string;
              error?: string;
              done?: boolean;
            };
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.text) {
              accumulated += payload.text;
              onUpdateMessages(
                device.id,
                nextMessages.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: accumulated } : m
                )
              );
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }

      if (!accumulated) {
        onUpdateMessages(
          device.id,
          nextMessages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, text: "已收到您的指令，但未返回内容，请重新提问。" }
              : m
          )
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "智能体响应异常";
      setErrorMsg(msg);
      onUpdateMessages(device.id, [...messages, userMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Contextual sub-header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0]/80 pb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-[12.5px] font-medium text-[#334155] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回设备列表</span>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#64748B]">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium leading-none ${
                  device.publisherType === "system"
                    ? "bg-[#EBF1FF] text-[#3B66F5] border border-[#D3E0FD]"
                    : "bg-[#ECFDF5] text-[#059669] border border-[#BCEFD7]"
                }`}
              >
                {device.publisherType === "system" ? "系统" : "用户"}
              </span>
              <span>{device.vendor}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{device.model}</span>
              <span aria-hidden="true">·</span>
              <span>{device.category}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onUpdateMessages(device.id, []);
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-medium text-[#475569] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>清空对话</span>
        </button>
      </div>

      {/* Main 2-column engineering layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left column: Device hardware profile & quick commands */}
        <div className="lg:col-span-4 rounded-[14px] border border-[#E2EAFE] bg-white/90 p-5 shadow-[0_4px_18px_rgba(68,100,235,0.05)] space-y-4">
          <div
            className="h-[150px] rounded-[10px] flex items-center justify-center p-3"
            style={{
              background:
                "linear-gradient(180deg, #ABC9FA 0%, #8CB5F6 46%, #5B8BE5 100%)",
            }}
          >
            <div className="h-full aspect-square rounded-[8px] bg-white p-1.5 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={device.image}
                alt={device.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div>
            <h2 className="text-[16px] font-bold text-[#0F172A] leading-snug">
              {device.title}
            </h2>
            <p className="mt-1.5 text-[12.5px] text-[#475569] leading-relaxed">
              {device.summary}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[#64748B]">
              {device.protocols.map((proto, index) => (
                <span key={proto} className="inline-flex items-center gap-2">
                  <span>{proto}</span>
                  {index < device.protocols.length - 1 && (
                    <span aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Segmented switcher: Specs vs Quick Commands */}
          <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
            <button
              type="button"
              onClick={() => setActiveSpecTab("specs")}
              className={`flex-1 py-1.5 px-3 text-[12px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSpecTab === "specs"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              硬件规格参数
            </button>
            <button
              type="button"
              onClick={() => setActiveSpecTab("commands")}
              className={`flex-1 py-1.5 px-3 text-[12px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeSpecTab === "commands"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              常用指令速查
            </button>
          </div>

          {activeSpecTab === "specs" ? (
            <dl className="divide-y divide-[#F1F5F9] text-[12.5px]">
              {device.specs.map((spec) => (
                <div key={spec.label} className="py-2 flex flex-col gap-0.5">
                  <dt className="text-[#64748B]">{spec.label}</dt>
                  <dd className="font-medium text-[#1E293B] font-mono-tabular">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="space-y-2.5">
              {device.quickCommands.map((item) => (
                <div
                  key={item.command}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[11.5px] font-mono-tabular text-[#3B66F5] font-medium break-all">
                      {item.command}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(item.command)}
                      className="shrink-0 p-1 rounded hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
                      title="复制指令"
                    >
                      {copiedCmd === item.command ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11.5px] text-[#64748B]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Interactive Device AI Agent Console */}
        <div className="lg:col-span-8 flex flex-col rounded-[14px] border border-[#E2EAFE] bg-white/95 shadow-[0_4px_18px_rgba(68,100,235,0.05)] min-h-[560px] max-h-[72vh]">
          {/* Console header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF2F6]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-[#0F172A]">
                  {device.model} 智能体工程助手
                </div>
                <div className="text-[11.5px] text-[#64748B] font-mono-tabular">
                  {device.defaultParams}
                </div>
              </div>
            </div>
            <span className="text-[11.5px] text-[#64748B]">
              首选代码: {preferences.codeLanguage} · 波特率: {preferences.baudRate}
            </span>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 text-center max-w-xl mx-auto">
                <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-[#0F172A]">
                  已就绪：{device.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] text-[#64748B] leading-relaxed">
                  您可以直接询问该设备的引脚接线、通讯协议配置、AT指令、Modbus寄存器映射、故障排查或请求生成集成调试代码。
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {device.starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] hover:border-[#93B4FD] hover:bg-[#EFF6FF] p-3 text-[12.5px] text-[#334155] transition-colors cursor-pointer flex items-start gap-2"
                    >
                      <Terminal className="w-3.5 h-3.5 text-[#3D68F5] shrink-0 mt-0.5" />
                      <span className="leading-snug">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[#3D68F5] text-white"
                        : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    ) : msg.text ? (
                      <FormattedMessageText text={msg.text} />
                    ) : (
                      <div className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#3D68F5] animate-pulse" />
                        <span>正在分析设备文档并生成方案...</span>
                      </div>
                    )}
                    <div
                      className={`mt-1.5 text-[10.5px] font-mono-tabular ${
                        msg.role === "user" ? "text-white/75 text-right" : "text-[#94A3B8]"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollEndRef} />
          </div>

          {errorMsg && (
            <div className="mx-5 mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-[12px] text-red-700 flex items-center justify-between gap-3">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-red-600 hover:text-red-800 font-medium cursor-pointer shrink-0"
              >
                关闭
              </button>
            </div>
          )}

          {/* Input composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-[#EEF2F6] p-3.5 flex items-end gap-2.5"
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={`输入关于 ${device.model} 的接线、指令或调试问题（Enter 发送，Shift+Enter 换行）...`}
              className="flex-1 resize-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:border-[#3D68F5] focus:outline-none px-3.5 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="h-[42px] px-4 rounded-xl bg-[#3D68F5] hover:bg-[#2E56DE] disabled:bg-[#94A3B8] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isStreaming ? "生成中" : "发送"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
