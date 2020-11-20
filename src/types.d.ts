interface CreepMemory {
  sourceId?: string;
  role: string;
  working?: boolean;
  roomName?: string;
}

interface SpawnMemory {
  spawning: {
    role: string;
    bodyParts: string[];
    cost: number;
  };
}

interface RoomMemory {
  baseLinkId: null | Id<StructureLink>;
}

interface SourceInfo {
  isActive: boolean;
  excavatorName: null | string;
  maxTrackMoveParts: number;
  truckNames: string[];
  linkId: null | Id<StructureLink>;
  pos: { x: number; y: number; roomName: string };
}

interface Memory {
  shouldDraw: boolean;
  uuid: number;
  log: any;
  sources: {
    [id: string]: SourceInfo;
  };
}

declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
