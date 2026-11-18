export interface DigitalTwinNodePosition {
  x: number;
  y: number;
}

export interface DigitalTwinProject {
  id: string;
  name: string;
  code: string;
  sceneType: string;
  accountName: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  syncedDeviceIds: string[];
  nodePositions: Record<string, DigitalTwinNodePosition>;
}
