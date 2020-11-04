interface CreepMemory {
  role: string;
  room: string;
  working: boolean;
}
interface RoomMemory {
  sourcesInfo: RoomSourceInfo[];
}
interface RoomSourceInfo {
  id: string;
  maxWorkers: number;
  workerNames: string[];
}
interface SpawnMemory {
  spawning: {
    role: string;
    bodyParts: string[];
    cost: number;
  };
}

interface Memory {
  uuid: number;
  log: any;
}

declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
