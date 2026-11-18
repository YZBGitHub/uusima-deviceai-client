import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FileUp,
  Paperclip,
  PlusCircle,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GatewayDeviceItem, GatewaySectionId } from "../types/gateway";
import type { AgentPreferences, ChatMessage } from "./AgentWorkspace";

interface ParsedSensorMetric {
  label: string;
  unit: string;
  register?: string;
}

interface ParsedRelayChannel {
  channel: string;
  label: string;
}

interface ParsedDeviceDraft {
  name: string;
  model: string;
  category: "modbus" | "camera";
  modbusType?: "sensor" | "relay";
  protocol: string;
  address: string;
  collectInterval?: number;
  rtspUrl?: string;
  sceneLabel?: string;
  sensorMetrics?: ParsedSensorMetric[];
  relayChannels?: ParsedRelayChannel[];
}

interface SpecAttachment {
  name: string;
  sizeLabel: string;
  mimeType: string;
  dataBase64?: string;
  textContent?: string;
}

interface AssistantMsg extends ChatMessage {
  attachmentName?: string;
  attachmentSize?: string;
  draftDevice?: ParsedDeviceDraft;
  imported?: boolean;
}

interface GatewayAssistantModalProps {
  open: boolean;
  initialMode?: "chat" | "import";
  onClose: () => void;
  contextSection: "agents" | "digital-twin" | GatewaySectionId;
  preferences: AgentPreferences;
  onImportDevice: (device: GatewayDeviceItem) => void;
}

const SECTION_LABELS: Record<"agents" | "digital-twin" | GatewaySectionId, string> = {
  agents: "设备智能体",
  "digital-twin": "数字孪生",
  "gw-dashboard": "仪表盘",
  "gw-devices": "设备管理",
  "gw-data": "数据管理",
  "gw-platform": "平台对接",
  "gw-ai-center": "智能中心",
  "gw-visualization": "可视化",
  "gw-comm-linkage": "通信与联动",
  "gw-ops-monitor": "运维监控",
  "gw-sys-config": "系统配置",
  "gw-security": "安全与维护",
};

const DEVICE_PROMPTS = [
  "Modbus 温湿度传感器（03功能码）寄存器地址和换算公式是什么？",
  "4路 Modbus 继电器控制开合（05/0F功能码）指令怎么发？",
  "摄像头 RTSP 拉流地址格式与常见黑屏排查步骤",
  "RS485 总线同时挂接传感器和继电器怎么避免地址冲突？",
];

const PLATFORM_PROMPTS = [
  "ThingsBoard MQTT 接入的 Access Token 和遥测 Topic 怎么填？",
  "行业云平台与 ThingsBoard 多通道同时转发需要注意什么？",
  "如何通过 ThingsBoard RPC 主题远程控制网关下挂的继电器？",
  "MQTT 连接报 5（未授权）或心跳超时断线如何排查？",
];

const IMPORT_GUIDE_PROMPTS = [
  "帮我接入挂在 COM1 站号 6 的温湿度传感器（HT-485-M）",
  "导入 IP 为 192.168.0.35 端口 502 站号 1 的四路 Modbus 继电器控制器",
  "接入一台海康视觉摄像头，IP 192.168.1.88，RTSP 通道 101",
  "我想接入一个设备，请引导我需要提供哪些参数",
];

const SAMPLE_DATASHEET_TEXT = `# 设备规格书：RS485 工业温湿度变送器 HT-485-M
产品型号：HT-485-M
设备类型：Modbus 传感器 (sensor)
通讯接口：RS485（两线制 A+/B-）
通讯协议：Modbus RTU
默认串口参数：COM1 · 站号 1 · 波特率 9600 · 8N1
推荐采集间隔：5 秒

## 寄存器映射表（功能码 0x03 读保持寄存器）
| 寄存器地址 | 测点名称 | 单位 | 换算公式 |
| --- | --- | --- | --- |
| 0x0000 | humidity (%RH) | %RH | 原始值 / 10 |
| 0x0001 | temperature (°C) | ℃ | 原始值 / 10（有符号补码） |
| 0x0002 | dew_point (°C) | ℃ | 原始值 / 10 |
`;

function normalizeProtocolId(rawProtocol: string, isCamera: boolean): string {
  if (isCamera) return "rtsp_onvif";
  const lower = rawProtocol.toLowerCase();
  if (lower.includes("rtu")) return "modbus_rtu";
  if (lower.includes("tcp") || lower.includes("modbus")) return "modbus_tcp";
  if (lower.includes("mqtt")) return "mqtt";
  if (lower.includes("opc_ua") || lower.includes("opc ua")) return "opc_ua";
  if (lower.includes("s7")) return "siemens_s7";
  return rawProtocol || "modbus_tcp";
}

function buildGatewayDeviceFromDraft(
  draft: ParsedDeviceDraft,
  fromSpec: boolean
): GatewayDeviceItem {
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const stamp = Date.now().toString().slice(-4);
  const isCamera = draft.category === "camera";
  const isRelay = !isCamera && draft.modbusType === "relay";
  const protocol = normalizeProtocolId(draft.protocol, isCamera);
  const interval =
    typeof draft.collectInterval === "number" && draft.collectInterval > 0
      ? draft.collectInterval
      : isCamera
        ? 1
        : 5;
  const sourceDetail = fromSpec
    ? "AI智能助手 · 设备规格书解析导入"
    : "AI智能助手对话引导导入";

  if (isCamera) {
    return {
      id: `cam-ai-${Date.now()}`,
      deviceId: `ai-cam-${stamp}`,
      name: draft.name || "AI引导接入摄像头",
      model: draft.model || "HIK-IPC-1080P",
      category: "camera",
      protocol,
      address: draft.address || "192.168.1.88:554",
      status: "online",
      collecting: true,
      collectInterval: interval,
      tags: fromSpec ? ["AI导入", "规格书", "摄像头"] : ["AI导入", "摄像头"],
      lastUpdate: now,
      sourceMethod: "ai",
      sourceDetail,
      rtspUrl:
        draft.rtspUrl ||
        `rtsp://${(draft.address || "192.168.1.88").split(":")[0]}:554/Streaming/Channels/101`,
      resolution: "1920×1080",
      fps: 25,
      sceneLabel: draft.sceneLabel || "AI 引导接入实时视频通道",
    };
  }

  if (isRelay) {
    const relayChannels =
      draft.relayChannels && draft.relayChannels.length > 0
        ? draft.relayChannels.map((ch, idx) => ({
            channel: ch.channel || `DO${idx + 1}`,
            label: ch.label || `控制回路 ${idx + 1}`,
            isOn: false,
          }))
        : [
            { channel: "DO1", label: "控制回路 1", isOn: false },
            { channel: "DO2", label: "控制回路 2", isOn: false },
            { channel: "DO3", label: "控制回路 3", isOn: false },
            { channel: "DO4", label: "控制回路 4", isOn: false },
          ];

    return {
      id: `mb-relay-ai-${Date.now()}`,
      deviceId: `ai-relay-${stamp}`,
      name: draft.name || "AI引导接入继电器控制器",
      model: draft.model || "USR-IO424T",
      category: "modbus",
      modbusType: "relay",
      protocol,
      address: draft.address || "192.168.0.35:502 · 站号 1",
      status: "online",
      collecting: true,
      collectInterval: interval,
      tags: fromSpec ? ["AI导入", "规格书", "继电器"] : ["AI导入", "继电器"],
      lastUpdate: now,
      sourceMethod: "ai",
      sourceDetail,
      relayChannels,
    };
  }

  const sensorMetrics =
    draft.sensorMetrics && draft.sensorMetrics.length > 0
      ? draft.sensorMetrics.map((m, idx) => ({
          key: `metric_${idx + 1}`,
          label: m.label,
          value: Number((22 + idx * 12.4).toFixed(1)),
          unit: m.unit || "",
          register: m.register || `0x000${idx}`,
        }))
      : [
          {
            key: "temperature",
            label: "temperature (°C)",
            value: 24.8,
            unit: "℃",
            register: "0x0001",
          },
          {
            key: "humidity",
            label: "humidity (%RH)",
            value: 55.2,
            unit: "%RH",
            register: "0x0000",
          },
        ];

  return {
    id: `mb-sensor-ai-${Date.now()}`,
    deviceId: `ai-sensor-${stamp}`,
    name: draft.name || "AI引导接入温湿度传感器",
    model: draft.model || "HT-485-M",
    category: "modbus",
    modbusType: "sensor",
    protocol,
    address: draft.address || "COM1 · 站号 6 · 9600 8N1",
    status: "online",
    collecting: true,
    collectInterval: interval,
    tags: fromSpec ? ["AI导入", "规格书", "传感器"] : ["AI导入", "传感器"],
    lastUpdate: now,
    sourceMethod: "ai",
    sourceDetail,
    sensorMetrics,
  };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function AssistantMessageContent({ text }: { text: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const parts = text.split(/(```[\s\S]*?```)/g);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-[#1E293B]">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const inner = part.slice(3, -3);
          const nl = inner.indexOf("\n");
          const lang = nl > -1 ? inner.slice(0, nl).trim() : "text";
          const code = nl > -1 ? inner.slice(nl + 1) : inner;
          return (
            <div
              key={idx}
              className="rounded-lg border border-[#CBD5E1] bg-[#0F172A] text-[#E2E8F0] overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1 bg-[#1E293B] border-b border-[#334155] text-[11px] text-[#94A3B8]">
                <span className="font-mono-tabular uppercase">
                  {lang || "code"}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(code.trim(), idx)}
                  className="inline-flex items-center gap-1 text-[#CBD5E1] hover:text-white cursor-pointer"
                >
                  {copiedIdx === idx ? (
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
              <pre className="p-2.5 overflow-x-auto text-[11.5px] font-mono-tabular leading-5">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={idx} className="whitespace-pre-wrap break-words">
            {part}
          </p>
        );
      })}
    </div>
  );
}

export function GatewayAssistantModal({
  open,
  initialMode = "chat",
  onClose,
  contextSection,
  preferences,
  onImportDevice,
}: GatewayAssistantModalProps) {
  const [mode, setMode] = useState<"chat" | "import">(initialMode);
  const [chatMessages, setChatMessages] = useState<AssistantMsg[]>([]);
  const [importMessages, setImportMessages] = useState<AssistantMsg[]>([]);
  const [input, setInput] = useState("");
  const [attachedSpec, setAttachedSpec] = useState<SpecAttachment | null>(null);
  const [isDraggingSpec, setIsDraggingSpec] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const specInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrorMsg(null);
    }
  }, [open, initialMode]);

  const activeMessages = mode === "import" ? importMessages : chatMessages;
  const setActiveMessages =
    mode === "import" ? setImportMessages : setChatMessages;

  useEffect(() => {
    if (open) {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages, open, isLoading]);

  if (!open) return null;

  const sectionLabel = SECTION_LABELS[contextSection] ?? "AI边缘网关";

  const handleSpecFileSelected = async (file: File) => {
    setErrorMsg(null);
    const lower = file.name.toLowerCase();
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel =
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    const isTextSpec =
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      lower.endsWith(".csv") ||
      lower.endsWith(".json") ||
      lower.endsWith(".log") ||
      file.type.startsWith("text/");

    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isImage =
      file.type.startsWith("image/") ||
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".webp");

    if (!isTextSpec && !isPdf && !isImage) {
      setErrorMsg(
        "目前支持上传 PDF、图片（PNG/JPG/WEBP）或 TXT/MD/CSV/JSON 格式的设备规格书。"
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("单个设备规格书文件请控制在 10MB 以内。");
      return;
    }

    try {
      if (isTextSpec) {
        const textContent = await file.text();
        setAttachedSpec({
          name: file.name,
          sizeLabel,
          mimeType: file.type || "text/plain",
          textContent,
        });
      } else {
        const mimeType =
          file.type ||
          (isPdf
            ? "application/pdf"
            : lower.endsWith(".png")
              ? "image/png"
              : lower.endsWith(".webp")
                ? "image/webp"
                : "image/jpeg");
        const dataBase64 = await readFileAsBase64(file);
        setAttachedSpec({
          name: file.name,
          sizeLabel,
          mimeType,
          dataBase64,
        });
      }
      setMode("import");
    } catch {
      setErrorMsg("读取设备规格书文件失败，请重试。");
    }
  };

  const handleDownloadSampleSpec = () => {
    const blob = new Blob([SAMPLE_DATASHEET_TEXT], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "HT-485-M_设备规格书.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImportDraft = (
    msgId: string,
    draft: ParsedDeviceDraft,
    fromSpec: boolean
  ) => {
    const newDevice = buildGatewayDeviceFromDraft(draft, fromSpec);
    onImportDevice(newDevice);
    setImportMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, imported: true } : m))
    );
  };

  const sendImportGuideMessage = async (
    promptText: string,
    overrideSpec?: SpecAttachment | null
  ) => {
    const trimmed = promptText.trim();
    const specToSend = overrideSpec !== undefined ? overrideSpec : attachedSpec;
    if ((!trimmed && !specToSend) || isLoading) return;

    setErrorMsg(null);
    const nowTime = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const displayMessage =
      trimmed ||
      `请解析已上传的设备规格书《${specToSend?.name ?? ""}》，提取参数并生成待导入设备配置。`;

    const userMsg: AssistantMsg = {
      id: `imp-u-${Date.now()}`,
      role: "user",
      text: displayMessage,
      attachmentName: specToSend?.name,
      attachmentSize: specToSend?.sizeLabel,
      timestamp: nowTime,
    };

    const nextHistory = [...importMessages, userMsg];
    setImportMessages(nextHistory);
    setInput("");
    setAttachedSpec(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/import-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: importMessages.map((m) => ({ role: m.role, text: m.text })),
          message: trimmed,
          attachment: specToSend
            ? {
                name: specToSend.name,
                mimeType: specToSend.mimeType,
                dataBase64: specToSend.dataBase64,
                textContent: specToSend.textContent,
              }
            : undefined,
        }),
      });

      const data = (await response.json()) as {
        replyText?: string;
        readyToImport?: boolean;
        device?: ParsedDeviceDraft;
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error || `请求失败 (${response.status})`);
      }

      const modelMsg: AssistantMsg = {
        id: `imp-m-${Date.now() + 1}`,
        role: "model",
        text: data.replyText || "已解析您的设备信息，请确认以下导入参数。",
        attachmentName: specToSend?.name,
        timestamp: new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        draftDevice:
          data.readyToImport && data.device ? data.device : undefined,
      };
      setImportMessages([...nextHistory, modelMsg]);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "AI 引导解析异常，请稍后重试。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const nowTime = new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: AssistantMsg = {
      id: `gw-u-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: nowTime,
    };

    const assistantId = `gw-m-${Date.now() + 1}`;
    const assistantMsg: AssistantMsg = {
      id: assistantId,
      role: "model",
      text: "",
      timestamp: nowTime,
    };

    const nextMessages = [...chatMessages, userMsg, assistantMsg];
    setChatMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const systemContext = `当前处于「AI边缘网关 - ${sectionLabel}」页面。用户端包含仪表盘、设备管理、数据管理、平台对接；系统端包含智能中心、可视化、通信与联动、运维监控、系统配置、安全与维护。`;

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: `AI边缘网关智能助手 (${sectionLabel})`,
          deviceModel: "AI-EDGE-GATEWAY",
          systemContext,
          preferences,
          history: chatMessages.map((m) => ({ role: m.role, text: m.text })),
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
      if (!reader) throw new Error("无法读取智能体响应流。");

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
            };
            if (payload.error) throw new Error(payload.error);
            if (payload.text) {
              accumulated += payload.text;
              setChatMessages(
                nextMessages.map((m) =>
                  m.id === assistantId ? { ...m, text: accumulated } : m
                )
              );
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message !== "Unexpected end of JSON input"
            ) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "AI智能助手连接异常，请稍后重试。"
      );
      setChatMessages([...chatMessages, userMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (text: string) => {
    if (mode === "import") {
      void sendImportGuideMessage(text);
    } else {
      void sendChatMessage(text);
    }
  };

  const canSend =
    mode === "import"
      ? !isLoading && (Boolean(input.trim()) || Boolean(attachedSpec))
      : !isLoading && Boolean(input.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gw-assistant-title"
    >
      <div
        onDragOver={(e) => {
          if (mode !== "import") return;
          e.preventDefault();
          setIsDraggingSpec(true);
        }}
        onDragLeave={() => setIsDraggingSpec(false)}
        onDrop={(e) => {
          if (mode !== "import") return;
          e.preventDefault();
          setIsDraggingSpec(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleSpecFileSelected(file);
        }}
        className={`relative w-full max-w-3xl h-[88vh] sm:h-[640px] max-h-[90vh] rounded-2xl border bg-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] flex flex-col overflow-hidden transition-colors ${
          isDraggingSpec
            ? "border-[#3D68F5] ring-2 ring-[#3D68F5]/30"
            : "border-[#DCE6FC]"
        }`}
      >
        <input
          ref={specInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleSpecFileSelected(file);
            e.target.value = "";
          }}
        />

        {/* Modal Header */}
        <div
          className="px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 text-white shrink-0"
          style={{
            background: "linear-gradient(135deg, #544BE4 0%, #3D68F5 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="gw-assistant-title"
                className="text-[15px] font-bold leading-snug"
              >
                AI 边缘网关智能助手
              </h2>
              <p className="text-[11.5px] text-white/80">
                当前上下文：AI边缘网关 · {sectionLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher: Chat vs AI Guided Import */}
            <div className="inline-flex items-center rounded-lg bg-white/15 p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => setMode("chat")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === "chat"
                    ? "bg-white text-[#3D68F5]"
                    : "text-white/85 hover:text-white"
                }`}
              >
                技术问答
              </button>
              <button
                type="button"
                onClick={() => setMode("import")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  mode === "import"
                    ? "bg-white text-[#3D68F5]"
                    : "text-white/85 hover:text-white"
                }`}
              >
                AI 导入设备
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveMessages([]);
                setAttachedSpec(null);
                setErrorMsg(null);
              }}
              title="清空对话"
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-[12px] text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭AI智能助手"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat History Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-5 py-4 space-y-4 bg-[#FAFBFF]">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-4">
              <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                {mode === "import"
                  ? "AI 对话 & 设备规格书解析导入"
                  : "AI 边缘网关助手已就绪"}
              </h3>
              <p className="mt-1.5 text-[12.5px] text-[#64748B] leading-relaxed">
                {mode === "import"
                  ? "支持直接对话描述设备参数，或上传设备规格书（PDF / 图片 / TXT / MD / CSV），AI 自动识别型号、协议、寄存器与通道并生成一键导入卡片。"
                  : "支持解答 Modbus 传感器/继电器接入、摄像头 RTSP 拉流调试，以及行业云与 ThingsBoard 的配置与排错问题。"}
              </p>

              {/* Upload Spec Card in AI Import empty state */}
              {mode === "import" && (
                <div className="mt-4 w-full rounded-xl border-2 border-dashed border-[#C7D2FE] bg-white px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] text-[#3D68F5] flex items-center justify-center shrink-0">
                      <FileUp className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">
                        上传设备规格书自动建档
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        支持拖入或选择 .pdf / .png / .jpg / .txt / .md / .csv
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadSampleSpec}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DCE6FC] bg-[#F8FAFF] hover:bg-[#EEF2FF] px-2.5 py-1.5 text-[11.5px] font-medium text-[#3D68F5] cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>示例规格书</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => specInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] px-3 py-1.5 text-[12px] font-medium text-white cursor-pointer whitespace-nowrap"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>选择规格书</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {(mode === "import"
                  ? IMPORT_GUIDE_PROMPTS
                  : contextSection === "gw-platform"
                    ? PLATFORM_PROMPTS
                    : DEVICE_PROMPTS
                ).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSubmit(prompt)}
                    className="rounded-xl border border-[#DCE6FC] bg-white hover:border-[#3D68F5] hover:bg-[#F4F7FF] p-3 text-[12px] text-[#334155] transition-colors cursor-pointer flex items-start gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5 text-[#3D68F5] shrink-0 mt-0.5" />
                    <span className="leading-snug">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] min-w-0 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                    msg.role === "user"
                      ? "bg-[#3D68F5] text-white"
                      : "bg-white border border-[#E2E8F0] text-[#1E293B] shadow-2xs"
                  }`}
                >
                  {msg.role === "user" && msg.attachmentName && (
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[11.5px] text-white">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate max-w-[260px]">
                        {msg.attachmentName}
                      </span>
                      {msg.attachmentSize && (
                        <span className="opacity-75 font-mono-tabular">
                          ({msg.attachmentSize})
                        </span>
                      )}
                    </div>
                  )}

                  {msg.role === "user" ? (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  ) : msg.text ? (
                    <AssistantMessageContent text={msg.text} />
                  ) : (
                    <div className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#3D68F5] animate-pulse" />
                      <span>正在分析网关配置并生成回复...</span>
                    </div>
                  )}

                  {/* AI-extracted structured device card for one-click import */}
                  {msg.draftDevice && (
                    <div className="mt-3 rounded-xl border border-[#DCE6FC] bg-[#F8FAFF] p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-bold text-[#0F172A]">
                          {msg.draftDevice.name}
                        </span>
                        <span className="rounded-md bg-[#EBF1FF] px-2 py-0.5 text-[11px] font-medium text-[#3D68F5]">
                          {msg.draftDevice.category === "camera"
                            ? "摄像头"
                            : msg.draftDevice.modbusType === "relay"
                              ? "Modbus · 继电器"
                              : "Modbus · 传感器"}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-[#475569] font-mono-tabular space-y-0.5">
                        <div>
                          型号：{msg.draftDevice.model} · 协议：
                          {msg.draftDevice.protocol}
                        </div>
                        <div>地址：{msg.draftDevice.address}</div>
                        {msg.draftDevice.rtspUrl && (
                          <div className="truncate">
                            RTSP：{msg.draftDevice.rtspUrl}
                          </div>
                        )}
                      </div>

                      {msg.draftDevice.sensorMetrics &&
                        msg.draftDevice.sensorMetrics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {msg.draftDevice.sensorMetrics.map((m, idx) => (
                              <span
                                key={idx}
                                className="rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-mono-tabular text-[#334155]"
                              >
                                {m.label}
                                {m.register ? ` (${m.register})` : ""}
                              </span>
                            ))}
                          </div>
                        )}

                      {msg.draftDevice.relayChannels &&
                        msg.draftDevice.relayChannels.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {msg.draftDevice.relayChannels.map((ch, idx) => (
                              <span
                                key={idx}
                                className="rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-[11px] font-mono-tabular text-[#334155]"
                              >
                                {ch.channel}: {ch.label}
                              </span>
                            ))}
                          </div>
                        )}

                      <div className="pt-1">
                        {msg.imported ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#059669]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>已成功导入设备管理列表</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmImportDraft(
                                msg.id,
                                msg.draftDevice!,
                                Boolean(msg.attachmentName)
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#3D68F5] hover:bg-[#2E56DE] px-3.5 py-1.5 text-[12px] font-medium text-white cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>确认导入到设备列表</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10.5px] font-mono-tabular ${
                      msg.role === "user"
                        ? "text-white/75 text-right"
                        : "text-[#94A3B8]"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && mode === "import" && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-[12.5px] text-[#64748B] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#3D68F5] animate-pulse" />
                <span>AI 正在识别设备规格书与协议参数...</span>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {errorMsg && (
          <div className="mx-5 my-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-[12px] text-red-700 flex items-center justify-between gap-2">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="font-medium hover:underline cursor-pointer shrink-0"
            >
              关闭
            </button>
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="border-t border-[#EEF2F6] bg-white p-3.5 space-y-2 shrink-0"
        >
          {mode === "import" && attachedSpec && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#C7D2FE] bg-[#EEF2FF]/70 px-3 py-1.5 text-[12px] text-[#1E3A8A]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#3D68F5] shrink-0" />
                <span className="font-medium truncate">
                  已附加设备规格书：{attachedSpec.name}
                </span>
                <span className="text-[11px] text-[#4F46E5] font-mono-tabular shrink-0">
                  ({attachedSpec.sizeLabel})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedSpec(null)}
                aria-label="移除规格书"
                className="p-0.5 rounded hover:bg-[#DBEAFE] text-[#4F46E5] cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-2.5">
            {mode === "import" && (
              <button
                type="button"
                onClick={() => specInputRef.current?.click()}
                title="上传设备规格书（PDF / 图片 / TXT / MD / CSV）"
                className="order-2 sm:order-1 h-[40px] sm:h-[42px] px-3 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:border-[#3D68F5] text-[#334155] hover:text-[#3D68F5] text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Paperclip className="w-4 h-4" />
                <span>上传规格书</span>
              </button>
            )}

            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) handleSubmit(input);
                }
              }}
              placeholder={
                mode === "import"
                  ? "可上传设备规格书直接解析，或输入补充要求（如：接入站号 2、波特率 9600 的设备）..."
                  : `向 AI 助手询问「${sectionLabel}」相关配置、协议指令或故障排查...`
              }
              className="order-1 sm:order-2 w-full sm:w-auto sm:flex-1 min-w-0 resize-none rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:bg-white focus:border-[#3D68F5] focus:outline-none px-3.5 py-2 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="order-3 ml-auto sm:ml-0 h-[40px] sm:h-[42px] px-4 rounded-xl bg-[#3D68F5] hover:bg-[#2E56DE] disabled:bg-[#94A3B8] text-white text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isLoading ? "解析中" : attachedSpec ? "解析导入" : "发送"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
