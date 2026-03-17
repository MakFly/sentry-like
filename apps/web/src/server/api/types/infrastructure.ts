export type InfraDateRange = "1h" | "6h" | "24h" | "7d";

export type InfraHost = {
  hostId: string;
  hostname: string;
  os: string;
  architecture: string | null;
  lastSeen: string;
};

export type InfraMetricsSnapshot = {
  hostId: string;
  hostname: string;
  cpu: {
    user: number;
    system: number;
    idle: number;
    count: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usedPercent: number;
    swapTotal: number;
    swapUsed: number;
  };
  disks: Array<{
    device: string;
    mountpoint: string;
    total: number;
    used: number;
    usedPercent: number;
  }> | null;
  networks: Array<{
    interface: string;
    bytesSent: number;
    bytesRecv: number;
    packetsSent: number;
    packetsRecv: number;
  }> | null;
  timestamp: string;
};

export type InfraMetricsHistory = {
  timestamp: string;
  cpu: {
    user: number;
    system: number;
    idle: number;
  };
  memory: {
    used: number;
    total: number;
    usedPercent: number;
    swapUsed: number;
  };
  disks: Array<{
    device: string;
    mountpoint: string;
    total: number;
    used: number;
    usedPercent: number;
  }> | null;
  networks: Array<{
    interface: string;
    bytesSent: number;
    bytesRecv: number;
  }> | null;
};
