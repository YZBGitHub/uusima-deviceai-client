export type GatewayDeviceCategory =
  | "modbus"
  | "camera"
  | "simulator"
  | "plc"
  | "fan"
  | "light"
  | "gateway";
export type ModbusSubType = "sensor" | "relay";

export type GatewayUserSectionId =
  | "gw-dashboard"
  | "gw-devices"
  | "gw-data"
  | "gw-platform";

export type GatewaySystemSectionId =
  | "gw-ai-center"
  | "gw-visualization"
  | "gw-comm-linkage"
  | "gw-ops-monitor"
  | "gw-sys-config"
  | "gw-security";

export type GatewaySectionId = GatewayUserSectionId | GatewaySystemSectionId;

export interface RelayChannel {
  channel: string;
  label: string;
  isOn: boolean;
}

export interface SensorMetric {
  key?: string;
  label: string;
  value: number;
  unit: string;
  register: string;
}

export interface GatewayDeviceItem {
  id: string;
  deviceId: string;
  name: string;
  model: string;
  category: GatewayDeviceCategory;
  modbusType?: ModbusSubType;
  protocol: string;
  address: string;
  status: "online" | "offline";
  collecting: boolean;
  collectInterval: number;
  tags: string[];
  lastUpdate: string;
  sourceMethod?: "manual" | "agent" | "ai" | "simulation" | "discover";
  sourceDetail?: string;
  sensorMetrics?: SensorMetric[];
  relayChannels?: RelayChannel[];
  fanRunning?: boolean;
  lightOn?: boolean;
  rtspUrl?: string;
  resolution?: string;
  fps?: number;
  sceneLabel?: string;
}

export interface GatewayLinkageRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerDeviceName: string;
  triggerPoint: string;
  condition: string;
  actionTarget: string;
  actionCommand: string;
  triggerCount: number;
  lastTriggered: string;
}

export interface GatewayAlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  deviceName: string;
  detail: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface GatewayAiEngineItem {
  id: string;
  name: string;
  framework: string;
  taskType: string;
  status: "running" | "stopped";
  targetDevices: string;
  confidenceThreshold: number;
  fpsOrRate: string;
  npuUsage: number;
  version: string;
}

export interface GatewayLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  module: string;
  message: string;
}
