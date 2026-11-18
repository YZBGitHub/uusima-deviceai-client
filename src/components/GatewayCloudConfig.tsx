import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Code2,
  Edit3,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Minus,
  Plus,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { useState } from "react";

type PlatformCategory = "thingsboard" | "industry-cloud";

interface CloudConnectionConfig {
  id: string;
  name: string;
  platformType: PlatformCategory;
  industryCloudName?: string;
  protocol: "MQTT 3.1.1" | "MQTT over TLS";
  host: string;
  port: number;
  accessKeyOrToken: string;
  accessSecret?: string;
  projectId?: string;
  enableCommandReceive: boolean;
  deviceStatusReport: boolean;
  clientId: string;
  username?: string;
  keepAlive: number;
  cleanSession: boolean;
  tlsEnabled: boolean;
  tlsSkipVerify: boolean;
  lwtEnabled: boolean;
  lwtTopic: string;
  lwtPayload: string;
  telemetryTopic: string;
  attributesOrControlTopic: string;
  payloadFormat: "standard" | "tsl" | "custom";
  qos: "0" | "1" | "2";
  retain: boolean;
  dedupEnabled: boolean;
  dedupWindowMs: number;
  enabled: boolean;
  lastCheckStatus: string;
  sentCount: number;
  latencyMs: number;
}

const INITIAL_CLOUD_CONFIGS: CloudConnectionConfig[] = [
  {
    id: "cfg-ind-newland",
    name: "新大陆教育行业云（实训主通道）",
    platformType: "industry-cloud",
    industryCloudName: "新大陆教育行业云",
    protocol: "MQTT 3.1.1",
    host: "mqtt.nlecloud.com",
    port: 1883,
    accessKeyOrToken: "NLE-EDU-202601",
    accessSecret: "nle_sec_9f82a4c1e034",
    projectId: "PRJ-EDU-001",
    enableCommandReceive: true,
    deviceStatusReport: true,
    clientId: "edge-gw-edu-01",
    username: "nle_gateway_01",
    keepAlive: 60,
    cleanSession: true,
    tlsEnabled: false,
    tlsSkipVerify: false,
    lwtEnabled: true,
    lwtTopic: "/nle/edu/edge-gw-edu-01/status",
    lwtPayload: '{"status":"offline"}',
    telemetryTopic: "/nle/edu/edge-gw-edu-01/telemetry",
    attributesOrControlTopic: "/nle/edu/edge-gw-edu-01/cmd",
    payloadFormat: "tsl",
    qos: "1",
    retain: false,
    dedupEnabled: true,
    dedupWindowMs: 500,
    enabled: true,
    lastCheckStatus: "已连接 (24ms)",
    sentCount: 14820,
    latencyMs: 24,
  },
  {
    id: "cfg-tb-01",
    name: "ThingsBoard 校内实训节点 #1",
    platformType: "thingsboard",
    protocol: "MQTT 3.1.1",
    host: "tb.iot-lab.edu.cn",
    port: 1883,
    accessKeyOrToken: "tb_gw_token_A94F82C1D0",
    enableCommandReceive: true,
    deviceStatusReport: true,
    clientId: "tb-edge-gateway-01",
    keepAlive: 60,
    cleanSession: true,
    tlsEnabled: false,
    tlsSkipVerify: false,
    lwtEnabled: false,
    lwtTopic: "v1/devices/me/attributes",
    lwtPayload: '{"online":false}',
    telemetryTopic: "v1/devices/me/telemetry",
    attributesOrControlTopic: "v1/devices/me/rpc/request/+",
    payloadFormat: "standard",
    qos: "1",
    retain: false,
    dedupEnabled: true,
    dedupWindowMs: 300,
    enabled: true,
    lastCheckStatus: "已连接 (18ms)",
    sentCount: 9642,
    latencyMs: 18,
  },
  {
    id: "cfg-ind-agri",
    name: "智慧农业行业云（温室监测）",
    platformType: "industry-cloud",
    industryCloudName: "智慧农业行业云",
    protocol: "MQTT over TLS",
    host: "iot-agri.cloud-industry.cn",
    port: 8883,
    accessKeyOrToken: "AGRI-PARK-08",
    accessSecret: "agri_sec_7712b9d01a",
    projectId: "AGRI-08",
    enableCommandReceive: true,
    deviceStatusReport: true,
    clientId: "agri-edge-gw-03",
    username: "agri_edge",
    keepAlive: 60,
    cleanSession: true,
    tlsEnabled: true,
    tlsSkipVerify: false,
    lwtEnabled: true,
    lwtTopic: "/agri/v1/park08/status",
    lwtPayload: '{"online":false}',
    telemetryTopic: "/agri/v1/park08/sensor/up",
    attributesOrControlTopic: "/agri/v1/park08/relay/down",
    payloadFormat: "tsl",
    qos: "1",
    retain: false,
    dedupEnabled: false,
    dedupWindowMs: 500,
    enabled: false,
    lastCheckStatus: "未启用",
    sentCount: 0,
    latencyMs: 0,
  },
];

type AccordionSectionKey =
  | "basic"
  | "mqtt"
  | "tls"
  | "lwt"
  | "topic"
  | "payload"
  | "qos"
  | "dedup";

const ACCORDION_ITEMS: { key: AccordionSectionKey; title: string }[] = [
  { key: "basic", title: "基本配置" },
  { key: "mqtt", title: "MQTT 连接" },
  { key: "tls", title: "TLS/SSL 安全" },
  { key: "lwt", title: "遗嘱消息 (Last Will)" },
  { key: "topic", title: "Topic 模板" },
  { key: "payload", title: "Payload 格式" },
  { key: "qos", title: "QoS 策略" },
  { key: "dedup", title: "消息去重" },
];

function createBlankDraft(platformType: PlatformCategory): CloudConnectionConfig {
  const suffix = Date.now().toString().slice(-4);
  if (platformType === "thingsboard") {
    return {
      id: `cfg-tb-${Date.now()}`,
      name: `ThingsBoard 平台 #${suffix}`,
      platformType: "thingsboard",
      protocol: "MQTT 3.1.1",
      host: "tb.iot-lab.edu.cn",
      port: 1883,
      accessKeyOrToken: "",
      enableCommandReceive: true,
      deviceStatusReport: true,
      clientId: `tb-edge-${suffix}`,
      keepAlive: 60,
      cleanSession: true,
      tlsEnabled: false,
      tlsSkipVerify: false,
      lwtEnabled: false,
      lwtTopic: "v1/devices/me/attributes",
      lwtPayload: '{"online":false}',
      telemetryTopic: "v1/devices/me/telemetry",
      attributesOrControlTopic: "v1/devices/me/rpc/request/+",
      payloadFormat: "standard",
      qos: "1",
      retain: false,
      dedupEnabled: true,
      dedupWindowMs: 500,
      enabled: true,
      lastCheckStatus: "已连接 (19ms)",
      sentCount: 0,
      latencyMs: 19,
    };
  }

  return {
    id: `cfg-ind-${Date.now()}`,
    name: `行业云平台 #${suffix}`,
    platformType: "industry-cloud",
    industryCloudName: "新大陆教育行业云",
    protocol: "MQTT 3.1.1",
    host: "mqtt.nlecloud.com",
    port: 1883,
    accessKeyOrToken: "",
    accessSecret: "",
    projectId: "",
    enableCommandReceive: true,
    deviceStatusReport: true,
    clientId: `ind-edge-${suffix}`,
    username: "edge_gateway",
    keepAlive: 60,
    cleanSession: true,
    tlsEnabled: false,
    tlsSkipVerify: false,
    lwtEnabled: true,
    lwtTopic: "/sys/gateway/status",
    lwtPayload: '{"status":"offline"}',
    telemetryTopic: "/sys/gateway/telemetry",
    attributesOrControlTopic: "/sys/gateway/cmd",
    payloadFormat: "tsl",
    qos: "1",
    retain: false,
    dedupEnabled: true,
    dedupWindowMs: 500,
    enabled: true,
    lastCheckStatus: "已连接 (26ms)",
    sentCount: 0,
    latencyMs: 26,
  };
}

export function GatewayCloudConfig() {
  const [configs, setConfigs] = useState<CloudConnectionConfig[]>(
    INITIAL_CLOUD_CONFIGS
  );
  const [statusBoardOpen, setStatusBoardOpen] = useState(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [previewCfg, setPreviewCfg] = useState<CloudConnectionConfig | null>(null);

  // Two-step Wizard Modal State matching Screenshots 1-3
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformCategory | null>(null);
  const [draft, setDraft] = useState<CloudConnectionConfig | null>(null);
  const [openSection, setOpenSection] =
    useState<AccordionSectionKey | null>("basic");
  const [showSecret, setShowSecret] = useState(false);
  const [wizardTestStatus, setWizardTestStatus] = useState<{
    state: "idle" | "testing" | "ok" | "error";
    text: string;
  }>({ state: "idle", text: "" });

  const openAddWizard = () => {
    setIsEditingExisting(false);
    setWizardStep(1);
    setSelectedPlatform(null);
    setDraft(null);
    setOpenSection("basic");
    setShowSecret(false);
    setWizardTestStatus({ state: "idle", text: "" });
    setWizardOpen(true);
  };

  const openEditWizard = (cfg: CloudConnectionConfig) => {
    setIsEditingExisting(true);
    setWizardStep(2);
    setSelectedPlatform(cfg.platformType);
    setDraft({ ...cfg });
    setOpenSection("basic");
    setShowSecret(false);
    setWizardTestStatus({ state: "idle", text: "" });
    setWizardOpen(true);
  };

  const handleGoToStep2 = () => {
    if (!selectedPlatform) return;
    setDraft(createBlankDraft(selectedPlatform));
    setOpenSection("basic");
    setWizardTestStatus({ state: "idle", text: "" });
    setWizardStep(2);
  };

  const handleWizardTestConnection = () => {
    if (!draft) return;
    if (!draft.host.trim() || !draft.accessKeyOrToken.trim()) {
      setWizardTestStatus({
        state: "error",
        text:
          draft.platformType === "thingsboard"
            ? "请填写 MQTT Broker 地址与 Access Token 后再测试连接。"
            : "请填写 MQTT Broker、Access Key 与 Access Secret 后再测试连接。",
      });
      return;
    }
    setWizardTestStatus({ state: "testing", text: "正在尝试 MQTT 握手建链..." });
    setTimeout(() => {
      const latency = 15 + Math.floor(Math.random() * 20);
      setWizardTestStatus({
        state: "ok",
        text: `连接 ${draft.host}:${draft.port} 成功，响应延迟 ${latency}ms，鉴权通过！`,
      });
    }, 450);
  };

  const handleWizardSubmit = () => {
    if (!draft) return;
    if (!draft.host.trim()) {
      setWizardTestStatus({
        state: "error",
        text: "请先填写 MQTT Broker 服务器地址。",
      });
      setOpenSection("basic");
      return;
    }
    if (!draft.accessKeyOrToken.trim()) {
      setWizardTestStatus({
        state: "error",
        text:
          draft.platformType === "thingsboard"
            ? "请填写 ThingsBoard Access Token。"
            : "请填写行业云 Access Key (ProjectId)。",
      });
      setOpenSection("basic");
      return;
    }

    const normalized: CloudConnectionConfig = {
      ...draft,
      protocol: draft.tlsEnabled ? "MQTT over TLS" : "MQTT 3.1.1",
      lastCheckStatus: draft.enabled
        ? `已连接 (${draft.latencyMs || 21}ms)`
        : "未启用",
    };

    if (isEditingExisting) {
      setConfigs((prev) =>
        prev.map((c) => (c.id === normalized.id ? normalized : c))
      );
      setBannerMsg(`已更新平台对接配置「${normalized.name}」`);
    } else {
      setConfigs((prev) => [normalized, ...prev]);
      setBannerMsg(`已连接并添加平台「${normalized.name}」`);
    }
    setWizardOpen(false);
  };

  const handleTestRow = (cfg: CloudConnectionConfig) => {
    const latency = 14 + Math.floor(Math.random() * 24);
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === cfg.id
          ? {
              ...c,
              latencyMs: latency,
              lastCheckStatus: `连通正常 (${latency}ms)`,
            }
          : c
      )
    );
    setBannerMsg(
      `「${cfg.name}」(${cfg.host}:${cfg.port}) 连通性校验成功，延迟 ${latency}ms`
    );
  };

  const handleToggleRow = (id: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              enabled: !c.enabled,
              lastCheckStatus: !c.enabled
                ? `已连接 (${c.latencyMs || 22}ms)`
                : "未启用",
            }
          : c
      )
    );
  };

  const handleDeleteRow = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const enabledConfigs = configs.filter((c) => c.enabled);

  return (
    <div className="space-y-4 pb-16">
      {/* Main Container Card matching Screenshot background */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
        {/* Card Header: 平台对接配置 | 状态看板 | 添加平台 */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-[#111827]">
              平台对接配置
            </h2>
            <span className="text-[12px] text-[#6B7280]">
              仅支持 ThingsBoard 与行业云平台对接
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setStatusBoardOpen((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusBoardOpen
                  ? "border-[#16A34A] bg-[#ECFDF5] text-[#16A34A]"
                  : "border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-[#374151]"
              }`}
            >
              状态看板
            </button>
            <button
              type="button"
              onClick={openAddWizard}
              className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>添加平台</span>
            </button>
          </div>
        </div>

        {/* Collapsible Status Board (状态看板) */}
        {statusBoardOpen && (
          <div className="px-5 py-4 border-b border-[#E5E7EB] bg-[#F9FAFB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
              <div className="text-[11.5px] text-[#6B7280]">已配置平台总数</div>
              <div className="mt-1 text-[20px] font-bold text-[#111827] font-mono-tabular">
                {configs.length}
              </div>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
              <div className="text-[11.5px] text-[#6B7280]">在线运行通道</div>
              <div className="mt-1 text-[20px] font-bold text-[#16A34A] font-mono-tabular">
                {enabledConfigs.length}
              </div>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
              <div className="text-[11.5px] text-[#6B7280]">累计上行报文</div>
              <div className="mt-1 text-[20px] font-bold text-[#2563EB] font-mono-tabular">
                {configs
                  .reduce((sum, c) => sum + c.sentCount, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
              <div className="text-[11.5px] text-[#6B7280]">平均 MQTT 延迟</div>
              <div className="mt-1 text-[20px] font-bold text-[#111827] font-mono-tabular">
                {enabledConfigs.length > 0
                  ? `${Math.round(
                      enabledConfigs.reduce((s, c) => s + (c.latencyMs || 20), 0) /
                        enabledConfigs.length
                    )} ms`
                  : "--"}
              </div>
            </div>
          </div>
        )}

        {bannerMsg && (
          <div className="mx-5 mt-4 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46] flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bannerMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              className="text-[12px] hover:underline cursor-pointer"
            >
              关闭
            </button>
          </div>
        )}

        {/* Platform List Table or Empty State */}
        {configs.length === 0 ? (
          <div className="py-20 px-6 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="text-[14px] font-medium text-[#374151]">
              暂无已配置的平台对接通道
            </div>
            <p className="text-[12.5px] text-[#6B7280]">
              点击右上角「添加平台」选择 ThingsBoard 或行业云进行接入配置
            </p>
            <button
              type="button"
              onClick={openAddWizard}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#16A34A] hover:bg-[#15803D] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加平台</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[12px] font-semibold text-[#374151]">
                  <th className="py-3 px-5 whitespace-nowrap">平台名称 / 类型</th>
                  <th className="py-3 px-4 whitespace-nowrap">MQTT Broker</th>
                  <th className="py-3 px-4 whitespace-nowrap">鉴权凭证</th>
                  <th className="py-3 px-4 whitespace-nowrap">Topic 模板</th>
                  <th className="py-3 px-4 whitespace-nowrap">连接状态</th>
                  <th className="py-3 px-5 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-[12.5px]">
                {configs.map((cfg) => (
                  <tr
                    key={cfg.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <Cloud
                          className={`w-4 h-4 shrink-0 ${
                            cfg.platformType === "thingsboard"
                              ? "text-[#16A34A]"
                              : "text-[#2563EB]"
                          }`}
                        />
                        <span className="font-semibold text-[#111827]">
                          {cfg.name}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-[#6B7280]">
                        {cfg.platformType === "thingsboard"
                          ? "ThingsBoard"
                          : cfg.industryCloudName || "行业云"}{" "}
                        · QoS {cfg.qos} · {cfg.protocol}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-tabular text-[#374151]">
                      <div>
                        {cfg.host}:{cfg.port}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        CID: {cfg.clientId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono-tabular text-[11.5px] text-[#374151]">
                      {cfg.platformType === "thingsboard"
                        ? `Token: ${cfg.accessKeyOrToken.slice(0, 12)}...`
                        : `Key: ${cfg.accessKeyOrToken || "--"}`}
                    </td>

                    <td className="py-3.5 px-4 font-mono-tabular text-[11.5px] text-[#4B5563]">
                      <div className="truncate max-w-[220px]">
                        上行: {cfg.telemetryTopic}
                      </div>
                      <div className="truncate max-w-[220px] text-[#6B7280]">
                        下行: {cfg.attributesOrControlTopic}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(cfg.id)}
                          className={`rounded border px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                            cfg.enabled
                              ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#16A34A]"
                              : "border-[#E5E7EB] bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                        >
                          {cfg.enabled ? "已启用" : "已停用"}
                        </button>
                        <span className="text-[11px] font-mono-tabular text-[#6B7280]">
                          {cfg.lastCheckStatus}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCfg(cfg)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-2.5 py-1 text-[11.5px] text-[#374151] cursor-pointer"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>报文</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTestRow(cfg)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-2.5 py-1 text-[11.5px] text-[#374151] cursor-pointer"
                        >
                          <Wifi className="w-3 h-3 text-[#16A34A]" />
                          <span>测连</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditWizard(cfg)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#A7F3D0] bg-white hover:bg-[#ECFDF5] px-2.5 py-1 text-[11.5px] font-medium text-[#16A34A] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>编辑</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(cfg.id)}
                          title="删除"
                          className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-red-50 hover:border-red-200 text-[#6B7280] hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Preview Modal */}
      {previewCfg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F3F4F6]">
              <h3 className="text-[14px] font-bold text-[#111827]">
                上行遥测报文预览 · {previewCfg.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewCfg(null)}
                className="p-1 rounded text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2 text-[12px]">
              <div className="text-[#6B7280] font-mono-tabular">
                Topic: {previewCfg.telemetryTopic}
              </div>
              <pre className="rounded-xl bg-[#0F172A] text-[#E2E8F0] p-4 overflow-x-auto font-mono-tabular text-[12px] leading-5">
{JSON.stringify(
  previewCfg.platformType === "thingsboard"
    ? {
        ts: Date.now(),
        values: {
          "sim-temperature-01.temperature": 32.85,
          "sim-temperature-01.humidity": 56.4,
        },
      }
    : {
        gatewayId: previewCfg.clientId,
        accessKey: previewCfg.accessKeyOrToken,
        timestamp: new Date().toISOString(),
        telemetry: { temperature: 32.85, humidity: 56.4 },
      },
  null,
  2
)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Wizard Modal replicating Screenshots 1-3 */}
      {wizardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-wizard-title"
        >
          <div className="w-full max-w-[660px] rounded-lg border border-[#E5E7EB] bg-white shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
              <h3
                id="platform-wizard-title"
                className="text-[16px] font-medium text-[#111827]"
              >
                {isEditingExisting
                  ? "编辑平台对接 — 填写配置"
                  : wizardStep === 1
                    ? "添加平台对接 — 选择平台"
                    : "添加平台对接 — 填写配置"}
              </h3>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                aria-label="关闭弹窗"
                className="p-1 text-[#6B7280] hover:text-[#111827] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Indicator */}
            <div className="px-6 py-3 flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                    wizardStep === 1
                      ? "bg-[#16A34A] text-white"
                      : "border border-[#16A34A] text-[#16A34A] bg-white"
                  }`}
                >
                  {wizardStep === 2 ? <Check className="w-3.5 h-3.5" /> : "1"}
                </span>
                <span
                  className={`text-[13px] ${
                    wizardStep === 1
                      ? "font-semibold text-[#111827]"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  选择平台
                </span>
              </div>

              <div
                className={`flex-1 h-px ${
                  wizardStep === 2 ? "bg-[#16A34A]" : "bg-[#E5E7EB]"
                }`}
              />

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                    wizardStep === 2
                      ? "bg-[#16A34A] text-white"
                      : "border border-[#D1D5DB] text-[#9CA3AF] bg-white"
                  }`}
                >
                  2
                </span>
                <span
                  className={`text-[13px] ${
                    wizardStep === 2
                      ? "font-semibold text-[#111827]"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  填写配置
                </span>
              </div>
            </div>

            {/* Step 1: 选择平台 (Only ThingsBoard & 行业云) */}
            {wizardStep === 1 && (
              <div className="px-6 pt-3 pb-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("thingsboard")}
                    className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                      selectedPlatform === "thingsboard"
                        ? "border-[#16A34A] bg-[#ECFDF5]/60 ring-1 ring-[#16A34A]"
                        : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="text-[14px] font-semibold text-[#111827]">
                      ThingsBoard
                    </div>
                    <div className="mt-1 text-[12px] text-[#6B7280]">
                      Open-source IoT platform (PE/CE)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("industry-cloud")}
                    className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                      selectedPlatform === "industry-cloud"
                        ? "border-[#16A34A] bg-[#ECFDF5]/60 ring-1 ring-[#16A34A]"
                        : "border-[#E5E7EB] bg-white hover:border-[#CBD5E1] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="text-[14px] font-semibold text-[#111827]">
                      行业云
                    </div>
                    <div className="mt-1 text-[12px] text-[#6B7280]">
                      新大陆教育行业云及垂直行业物联网云平台
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!selectedPlatform}
                  onClick={handleGoToStep2}
                  className={`w-full rounded-md py-2.5 text-[13.5px] font-medium text-white transition-colors ${
                    selectedPlatform
                      ? "bg-[#16A34A] hover:bg-[#15803D] cursor-pointer"
                      : "bg-[#9BD9B4] cursor-not-allowed"
                  }`}
                >
                  下一步：填写配置
                </button>
              </div>
            )}

            {/* Step 2: 填写配置 with 8 Accordion Sections matching Screenshots 2-3 */}
            {wizardStep === 2 && draft && (
              <>
                <div className="px-6 pb-4 space-y-3 overflow-y-auto flex-1">
                  {!isEditingExisting && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="inline-flex items-center gap-1.5 text-[12.5px] text-[#4B5563] hover:text-[#111827] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>返回选择平台</span>
                    </button>
                  )}

                  {/* Blue Context Info Banner */}
                  <div className="rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2.5 flex items-center gap-2.5 text-[12.5px] text-[#1E3A8A]">
                    <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>
                      正在配置{" "}
                      <strong>
                        {draft.platformType === "thingsboard"
                          ? "ThingsBoard"
                          : "行业云"}
                      </strong>{" "}
                      —{" "}
                      {draft.platformType === "thingsboard"
                        ? "Open-source IoT platform (PE/CE)"
                        : "行业云物联网接入平台"}
                    </span>
                  </div>

                  {/* 8 Accordion Sections */}
                  <div className="divide-y divide-[#E5E7EB] border-t border-b border-[#E5E7EB]">
                    {ACCORDION_ITEMS.map((sec) => {
                      const expanded = openSection === sec.key;
                      return (
                        <div key={sec.key} className="py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSection(expanded ? null : sec.key)
                            }
                            className="w-full py-2.5 flex items-center gap-2 text-left text-[13px] font-medium text-[#111827] hover:text-[#16A34A] cursor-pointer"
                          >
                            {expanded ? (
                              <ChevronDown className="w-4 h-4 text-[#4B5563]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#4B5563]" />
                            )}
                            <span>{sec.title}</span>
                          </button>

                          {expanded && sec.key === "basic" && (
                            <div className="pb-4 pt-2 pl-2 pr-1 space-y-3 text-[12.5px]">
                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151]">
                                  配置名称 <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={draft.name}
                                  onChange={(e) =>
                                    setDraft({ ...draft, name: e.target.value })
                                  }
                                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 focus:border-[#16A34A] focus:outline-none"
                                />
                              </div>

                              {draft.platformType === "industry-cloud" && (
                                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                  <label className="text-right text-[#374151]">
                                    所属行业云 <span className="text-[#EF4444]">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.industryCloudName ?? ""}
                                    onChange={(e) =>
                                      setDraft({
                                        ...draft,
                                        industryCloudName: e.target.value,
                                      })
                                    }
                                    placeholder="如：新大陆教育行业云 / 智慧农业云"
                                    className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 focus:border-[#16A34A] focus:outline-none"
                                  />
                                </div>
                              )}

                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151]">
                                  MQTT Broker <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={draft.host}
                                  onChange={(e) =>
                                    setDraft({ ...draft, host: e.target.value })
                                  }
                                  placeholder={
                                    draft.platformType === "thingsboard"
                                      ? "e.g. tb.iot-lab.edu.cn"
                                      : "e.g. mqtt.nlecloud.com"
                                  }
                                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151]">
                                  Port <span className="text-[#EF4444]">*</span>
                                </label>
                                <div className="flex items-center rounded border border-[#E5E7EB] overflow-hidden">
                                  <input
                                    type="number"
                                    value={draft.port}
                                    onChange={(e) =>
                                      setDraft({
                                        ...draft,
                                        port: Number(e.target.value) || 1883,
                                      })
                                    }
                                    className="flex-1 px-3 py-1.5 font-mono-tabular focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraft({
                                        ...draft,
                                        port: Math.max(1, draft.port - 1),
                                      })
                                    }
                                    className="px-2.5 py-1.5 border-l border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraft({
                                        ...draft,
                                        port: Math.min(65535, draft.port + 1),
                                      })
                                    }
                                    className="px-2.5 py-1.5 border-l border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151] leading-tight">
                                  {draft.platformType === "thingsboard"
                                    ? "Access Token"
                                    : "Access Key (ProjectId)"}{" "}
                                  <span className="text-[#EF4444]">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={draft.accessKeyOrToken}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      accessKeyOrToken: e.target.value,
                                    })
                                  }
                                  placeholder="必填"
                                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                />
                              </div>

                              {draft.platformType === "industry-cloud" && (
                                <>
                                  <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                    <label className="text-right text-[#374151]">
                                      Access Secret{" "}
                                      <span className="text-[#EF4444]">*</span>
                                    </label>
                                    <div className="relative">
                                      <input
                                        type={showSecret ? "text" : "password"}
                                        value={draft.accessSecret ?? ""}
                                        onChange={(e) =>
                                          setDraft({
                                            ...draft,
                                            accessSecret: e.target.value,
                                          })
                                        }
                                        placeholder="必填"
                                        className="w-full rounded border border-[#E5E7EB] pl-3 pr-9 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowSecret((v) => !v)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] cursor-pointer"
                                      >
                                        {showSecret ? (
                                          <EyeOff className="w-3.5 h-3.5" />
                                        ) : (
                                          <Eye className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                    <label className="text-right text-[#374151]">
                                      Project ID
                                    </label>
                                    <input
                                      type="text"
                                      value={draft.projectId ?? ""}
                                      onChange={(e) =>
                                        setDraft({
                                          ...draft,
                                          projectId: e.target.value,
                                        })
                                      }
                                      placeholder="可选"
                                      className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                    />
                                  </div>
                                </>
                              )}

                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151] leading-tight">
                                  Enable Command Receive
                                </label>
                                <select
                                  value={String(draft.enableCommandReceive)}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      enableCommandReceive:
                                        e.target.value === "true",
                                    })
                                  }
                                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                >
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                                <label className="text-right text-[#374151] leading-tight">
                                  Device Status Report
                                </label>
                                <select
                                  value={String(draft.deviceStatusReport)}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      deviceStatusReport:
                                        e.target.value === "true",
                                    })
                                  }
                                  className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-1.5 font-mono-tabular focus:border-[#16A34A] focus:outline-none"
                                >
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {expanded && sec.key === "mqtt" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 space-y-3 text-[12.5px]">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[#374151] mb-1">
                                    Client ID
                                  </label>
                                  <input
                                    type="text"
                                    value={draft.clientId}
                                    onChange={(e) =>
                                      setDraft({ ...draft, clientId: e.target.value })
                                    }
                                    className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[#374151] mb-1">
                                    Keep Alive (秒)
                                  </label>
                                  <input
                                    type="number"
                                    value={draft.keepAlive}
                                    onChange={(e) =>
                                      setDraft({
                                        ...draft,
                                        keepAlive: Number(e.target.value) || 60,
                                      })
                                    }
                                    className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                  />
                                </div>
                              </div>
                              <label className="inline-flex items-center gap-2 text-[#374151] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.cleanSession}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      cleanSession: e.target.checked,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>Clean Session（清除会话）</span>
                              </label>
                            </div>
                          )}

                          {expanded && sec.key === "tls" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 space-y-2.5 text-[12.5px]">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.tlsEnabled}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      tlsEnabled: e.target.checked,
                                      port: e.target.checked ? 8883 : 1883,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>启用 TLS/SSL 加密通道（自动切换端口 8883）</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.tlsSkipVerify}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      tlsSkipVerify: e.target.checked,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>跳过自签名证书主机名校验</span>
                              </label>
                            </div>
                          )}

                          {expanded && sec.key === "lwt" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 space-y-2.5 text-[12.5px]">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.lwtEnabled}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      lwtEnabled: e.target.checked,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>启用设备离线遗嘱通知 (Last Will)</span>
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={draft.lwtTopic}
                                  onChange={(e) =>
                                    setDraft({ ...draft, lwtTopic: e.target.value })
                                  }
                                  placeholder="Will Topic"
                                  className="rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                />
                                <input
                                  type="text"
                                  value={draft.lwtPayload}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      lwtPayload: e.target.value,
                                    })
                                  }
                                  placeholder="Will Payload"
                                  className="rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                />
                              </div>
                            </div>
                          )}

                          {expanded && sec.key === "topic" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 space-y-2.5 text-[12.5px]">
                              <div>
                                <label className="block text-[#374151] mb-1">
                                  上行遥测 Topic 模板
                                </label>
                                <input
                                  type="text"
                                  value={draft.telemetryTopic}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      telemetryTopic: e.target.value,
                                    })
                                  }
                                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                />
                              </div>
                              <div>
                                <label className="block text-[#374151] mb-1">
                                  下行控制 / RPC 订阅 Topic
                                </label>
                                <input
                                  type="text"
                                  value={draft.attributesOrControlTopic}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      attributesOrControlTopic: e.target.value,
                                    })
                                  }
                                  className="w-full rounded border border-[#E5E7EB] px-3 py-1.5 font-mono-tabular"
                                />
                              </div>
                            </div>
                          )}

                          {expanded && sec.key === "payload" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 text-[12.5px]">
                              <label className="block text-[#374151] mb-1">
                                上行 JSON 序列化格式
                              </label>
                              <select
                                value={draft.payloadFormat}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    payloadFormat: e.target
                                      .value as CloudConnectionConfig["payloadFormat"],
                                  })
                                }
                                className="w-full rounded border border-[#E5E7EB] bg-white px-3 py-1.5"
                              >
                                <option value="standard">
                                  ThingsBoard Standard JSON
                                </option>
                                <option value="tsl">行业云标准物模型 JSON</option>
                                <option value="custom">自定义模板映射</option>
                              </select>
                            </div>
                          )}

                          {expanded && sec.key === "qos" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 flex items-center gap-6 text-[12.5px]">
                              <label className="inline-flex items-center gap-2">
                                <span>QoS 等级：</span>
                                <select
                                  value={draft.qos}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      qos: e.target.value as "0" | "1" | "2",
                                    })
                                  }
                                  className="rounded border border-[#E5E7EB] bg-white px-2.5 py-1 font-mono-tabular"
                                >
                                  <option value="0">QoS 0 (至多一次)</option>
                                  <option value="1">QoS 1 (至少一次)</option>
                                  <option value="2">QoS 2 (仅一次)</option>
                                </select>
                              </label>
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.retain}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      retain: e.target.checked,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>Retain 保留消息</span>
                              </label>
                            </div>
                          )}

                          {expanded && sec.key === "dedup" && (
                            <div className="pb-4 pt-2 pl-6 pr-1 flex flex-wrap items-center gap-4 text-[12.5px]">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={draft.dedupEnabled}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      dedupEnabled: e.target.checked,
                                    })
                                  }
                                  className="accent-[#16A34A]"
                                />
                                <span>启用边缘重复遥测消息去重</span>
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <span>时间窗 (ms)：</span>
                                <input
                                  type="number"
                                  value={draft.dedupWindowMs}
                                  onChange={(e) =>
                                    setDraft({
                                      ...draft,
                                      dedupWindowMs: Number(e.target.value) || 500,
                                    })
                                  }
                                  className="w-24 rounded border border-[#E5E7EB] px-2.5 py-1 font-mono-tabular"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {wizardTestStatus.state !== "idle" && (
                    <div
                      className={`rounded-md border px-3.5 py-2 text-[12px] flex items-center gap-2 ${
                        wizardTestStatus.state === "ok"
                          ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
                          : wizardTestStatus.state === "error"
                            ? "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
                            : "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]"
                      }`}
                    >
                      {wizardTestStatus.state === "testing" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : wizardTestStatus.state === "ok" ? (
                        <Activity className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{wizardTestStatus.text}</span>
                    </div>
                  )}
                </div>

                {/* Step 2 Footer matching Screenshot 2: 上一步 | 测试连接 | 连接 */}
                <div className="px-6 py-3.5 border-t border-[#E5E7EB] bg-white flex items-center justify-end gap-2.5 shrink-0">
                  {!isEditingExisting && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="rounded-md border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] px-4 py-1.5 text-[12.5px] font-medium text-[#374151] cursor-pointer"
                    >
                      上一步
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleWizardTestConnection}
                    className="rounded-md border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] px-4 py-1.5 text-[12.5px] font-medium text-[#374151] cursor-pointer"
                  >
                    测试连接
                  </button>
                  <button
                    type="button"
                    onClick={handleWizardSubmit}
                    className="rounded-md bg-[#16A34A] hover:bg-[#15803D] px-4 py-1.5 text-[12.5px] font-medium text-white cursor-pointer"
                  >
                    {isEditingExisting ? "保存配置" : "连接"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
