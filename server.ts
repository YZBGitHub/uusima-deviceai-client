import "dotenv/config";
import express from "express";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

interface NetworkCandidate {
  name: string;
  address: string;
  score: number;
}

function isPrivateLanIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

function getLocalNetworkInterfaces(): {
  primaryIp: string;
  interfaces: Array<{ name: string; address: string }>;
} {
  const nets = os.networkInterfaces();
  const candidates: NetworkCandidate[] = [];

  for (const [name, entries] of Object.entries(nets)) {
    if (!entries) continue;
    for (const iface of entries) {
      const familyStr = String(iface.family);
      if ((familyStr !== "IPv4" && iface.family !== (4 as unknown)) || iface.internal) {
        continue;
      }

      const addr = iface.address;
      let score = 0;
      if (addr.startsWith("192.168.")) score += 100;
      else if (addr.startsWith("10.")) score += 80;
      else if (isPrivateLanIpv4(addr)) score += 70;
      else if (addr.startsWith("169.254.")) score -= 100;
      else score += 30;

      const lower = name.toLowerCase();
      if (/^(en|eth|wlan|wi-fi|wifi|eno|ens|enp|wlp)/.test(lower)) score += 30;
      if (/(docker|br-|veth|virbr|vmnet|utun|tun|tap|tailscale|wg|vbox)/.test(lower)) {
        score -= 50;
      }

      candidates.push({ name, address: addr, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const primaryIp = candidates[0]?.address || "127.0.0.1";

  return {
    primaryIp,
    interfaces: candidates.map(({ name, address }) => ({ name, address })),
  };
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

interface ChatTurn {
  role: "user" | "model";
  text: string;
}

interface AgentChatRequest {
  deviceName?: string;
  deviceModel?: string;
  systemContext?: string;
  preferences?: {
    baudRate?: string;
    codeLanguage?: string;
    detailLevel?: string;
  };
  history?: ChatTurn[];
  message?: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "15mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.get("/api/network/local-ip", (_req, res) => {
    const info = getLocalNetworkInterfaces();
    res.json({
      primaryIp: info.primaryIp,
      port: PORT,
      interfaces: info.interfaces,
    });
  });

  app.post("/api/agent/chat", async (req, res) => {
    const body = req.body as AgentChatRequest;
    const message = body.message?.trim();

    if (!message) {
      res.status(400).json({ error: "请输入需要咨询的设备问题或指令。" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: "服务端未检测到 GEMINI_API_KEY 环境变量，请在 Settings > Secrets 面板中配置后重试。",
      });
      return;
    }

    const prefs = body.preferences ?? {};
    const detailInstruction =
      prefs.detailLevel === "concise"
        ? "回答请尽量精简直接，优先给出寄存器地址、AT指令或核心代码。"
        : "回答请条理清晰、步骤明确，适合工程调试与教学实训使用。";

    const systemInstruction = [
      `你是「${body.deviceName || "工业设备"}」（型号：${body.deviceModel || "标准工业终端"}）的专属设备智能体工程师助手。`,
      body.systemContext || "",
      `用户默认偏好：常用波特率 ${prefs.baudRate || "115200"}，首选示例代码语言 ${prefs.codeLanguage || "Python"}。${detailInstruction}`,
      "回答准则：",
      "1. 严格基于工业物联网（RS232/RS485、Modbus RTU/TCP、MQTT、LoRa、4G DTU、TCP透传、数字量IO、边缘网关）的真实工程规范作答。",
      "2. 涉及接线、地址、寄存器或命令时，使用清晰的 Markdown 列表或表格，代码使用标准 Markdown 代码块。",
      "3. 如遇到潜在强电/接线安全风险（如继电器带载、DC电源极性），请附带简短安全提示。",
      "4. 使用简体中文回答。",
    ]
      .filter(Boolean)
      .join("\n");

    const historyContents = (body.history ?? []).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-4-hydrogen",
        contents: [
          ...historyContents,
          { role: "user", parts: [{ text: message }] },
        ],
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "调用智能体服务失败，请稍后重试。";
      console.error("Agent chat error:", errorMessage);
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  });

  app.post("/api/agent/import-guide", async (req, res) => {
    const body = req.body as {
      history?: ChatTurn[];
      message?: string;
      attachment?: {
        name: string;
        mimeType: string;
        dataBase64?: string;
        textContent?: string;
      };
    };
    const rawMessage = body.message?.trim() ?? "";
    const attachment = body.attachment;

    if (!rawMessage && !attachment) {
      res.status(400).json({ error: "请输入设备描述信息或上传设备规格书。" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: "服务端未检测到 GEMINI_API_KEY 环境变量，请在 Settings > Secrets 面板中配置后重试。",
      });
      return;
    }

    const systemInstruction = [
      "你是 AI 边缘网关设备导入向导助手，擅长通过自然语言对话和解析用户上传的【设备规格书 / 说明书 / 寄存器手册】（PDF、图片、TXT/MD/CSV/JSON）来提取标准化设备接入参数。",
      "当前边缘网关支持接入的核心设备类型：",
      "1) Modbus 设备（category 为 'modbus'，modbusType 必须为 'sensor' 传感器 或 'relay' 继电器），protocol 优先使用标准协议标识：'modbus_rtu' 或 'modbus_tcp'。",
      "2) 摄像头设备（category 为 'camera'），protocol 使用 'rtsp_onvif'，需给出 rtspUrl（如 rtsp://192.168.1.88:554/Streaming/Channels/101）。",
      "任务规则：",
      "- 当用户上传设备规格书时，仔细识别其中的设备名称、型号、通讯协议、默认波特率/校验位/串口或TCP端口、站号/Slave ID、寄存器地址表（sensorMetrics）或继电器控制通道（relayChannels）、推荐采集间隔。",
      "- 如果规格书或用户描述已包含足够的设备类型与协议特征（哪怕缺少现场IP/站号，也可先按规格书默认值补全并在 replyText 中提示可核对修改），请将 readyToImport 设为 true，并填充完整的 device 对象，方便用户一键确认导入。",
      "- 如果用户描述过于模糊且未上传规格书（例如仅说“我想接入一个设备”），请将 readyToImport 设为 false，在 replyText 中温和引导用户上传设备规格书或提供设备类型与连接参数。",
      "- 使用简体中文回复。",
    ].join("\n");

    const historyContents = (body.history ?? []).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    const userParts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    const effectivePrompt =
      rawMessage ||
      `请解析我上传的设备规格书《${attachment?.name ?? "未命名文件"}》，提取设备型号、协议、通信参数及测点/控制通道，并生成可直接导入的设备配置。`;

    if (attachment?.textContent) {
      userParts.push({
        text: `${effectivePrompt}\n\n【上传的设备规格书文本内容（文件名：${attachment.name}）】\n${attachment.textContent.slice(0, 45000)}`,
      });
    } else if (attachment?.dataBase64 && attachment.mimeType) {
      userParts.push({
        text: `${effectivePrompt}\n（已附带设备规格书文件：${attachment.name}）`,
      });
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.dataBase64,
        },
      });
    } else {
      userParts.push({ text: effectivePrompt });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: [
          ...historyContents,
          { role: "user", parts: userParts },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: {
                type: Type.STRING,
                description: "给用户的自然语言引导、规格书解析要点总结或参数核对说明。",
              },
              readyToImport: {
                type: Type.BOOLEAN,
                description: "是否已经识别出足够参数可以生成待导入设备卡片。",
              },
              device: {
                type: Type.OBJECT,
                description: "识别出的标准化设备参数（readyToImport 为 true 时必填）。",
                properties: {
                  name: { type: Type.STRING },
                  model: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description: "只能为 modbus 或 camera",
                  },
                  modbusType: {
                    type: Type.STRING,
                    description: "当 category 为 modbus 时只能为 sensor 或 relay",
                  },
                  protocol: {
                    type: Type.STRING,
                    description: "优先使用 modbus_tcp、modbus_rtu 或 rtsp_onvif",
                  },
                  address: { type: Type.STRING },
                  collectInterval: { type: Type.NUMBER },
                  rtspUrl: { type: Type.STRING },
                  sceneLabel: { type: Type.STRING },
                  sensorMetrics: {
                    type: Type.ARRAY,
                    description: "从规格书寄存器表中提取的测点列表（仅传感器适用）",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        unit: { type: Type.STRING },
                        register: { type: Type.STRING },
                      },
                    },
                  },
                  relayChannels: {
                    type: Type.ARRAY,
                    description: "从规格书中提取的继电器通道列表（仅继电器适用）",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        channel: { type: Type.STRING },
                        label: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
            },
            required: ["replyText", "readyToImport"],
          },
        },
      });

      const raw = (response.text ?? "{}").trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "AI 引导解析失败，请稍后重试。";
      console.error("Import guide error:", errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
