interface CreepMemory {
  sourceId?: string;
  role: string;
  working?: boolean;
  parentRoomName: string;
  targetRoomName?: string;
}

interface SpawnMemory {
  spawning: {
    role: string;
    bodyParts: string[];
    cost: number;
  };
}

interface SourceInfo {
  isActive: boolean;
  type: string;
  remoteHarvestingFromRoom: null | string;
  excavatorName: null | string;
  maxTrackCarryParts: number;
  truckNames: string[];
  linkId: null | Id<StructureLink>;
  pos: { x: number; y: number; roomName: string };
}

interface LinkMemory {
  type: 'source' | 'base' | 'target';
  roomName: string;
}

interface Memory {
  shouldDraw: boolean;
  uuid: number;
  log: any;
  sources: {
    [id: string]: SourceInfo;
  };
  links: {
    [id: string]: LinkMemory;
  };
  remoteHarvestingInRoom: {
    [roomName: string]: {
      isActive: boolean;
      mainRoomName: string;
      guardName: null | string;
      claimerName: null | string;
      builderName: null | string;
    };
  };
}

declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
