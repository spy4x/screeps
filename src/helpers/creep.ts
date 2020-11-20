import { WorkerRoles } from './types';
import { DrawService } from './draw.service';

export function getRoleShortName(role: WorkerRoles): string {
  switch (role) {
    case WorkerRoles.towerDrainer:
      return '😅';
    case WorkerRoles.builder:
      return '👷';
    case WorkerRoles.upgrader:
      return '⚡';
    case WorkerRoles.excavator:
      return '⛏️';
    case WorkerRoles.truck:
      return '🚚';
    case WorkerRoles.balancer:
      return '⚖️';
    case WorkerRoles.scout:
      return '🏇';
    case WorkerRoles.attacker:
      return '⚔️';
    case WorkerRoles.dummy:
      return '😱';
  }
}

export const createName = (role: WorkerRoles): string => {
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const name = `${getRoleShortName(role)}${i}`;
    if (!Game.creeps[name]) {
      return name;
    }
    i++;
    if (i > 100) {
      return `${role}_${Math.random()}`.replace('0.', '');
    }
  }
};

function getPathColorForRole(role: WorkerRoles): string {
  switch (role) {
    case WorkerRoles.excavator:
      return '#fff200'; // gold
    case WorkerRoles.truck:
      return '#aaff00'; // bright yellow
    case WorkerRoles.upgrader:
      return '#ea00ff'; // violet
    case WorkerRoles.builder:
      return '#0062ff'; // blue
    case WorkerRoles.balancer:
      return '#00ffd9'; // cyan
    case WorkerRoles.scout:
      return '#a87332'; // orange
    case WorkerRoles.towerDrainer:
      return '#FF0000'; // red
    case WorkerRoles.attacker:
      return '#FF0000'; // red
    case WorkerRoles.dummy:
      return '#00ffd9'; // cyan
  }
}

export function harvest(creep: Creep, source: Source | StructureExtractor): void {
  const target = source instanceof Source ? source : source.pos.lookFor(LOOK_MINERALS)[0];
  const harvestResult = creep.harvest(target);
  if (harvestResult === ERR_NOT_IN_RANGE) {
    moveTo(creep, source);
  } else if (
    harvestResult !== OK &&
    harvestResult !== ERR_BUSY &&
    harvestResult !== ERR_NOT_ENOUGH_RESOURCES &&
    harvestResult !== ERR_TIRED
  ) {
    console.log('harvest(): Error:', JSON.stringify({ creep: creep.name, harvestResult }));
  }
}

export function moveTo(
  creep: Creep,
  target: RoomPosition | { pos: RoomPosition },
  opts?: MoveToOpts
): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
  return creep.moveTo(target, {
    visualizePathStyle: { stroke: getPathColorForRole(creep.memory.role as WorkerRoles), opacity: 0.8 },
    ...opts
  });
}

export function getClosestSource(
  creep: Creep,
  filter: (sourceInfo: SourceInfo, source: Source | StructureExtractor) => boolean
): null | Source | StructureExtractor {
  const flag = Game.flags['remote_harvest'];
  return (
    creep.pos.findClosestByRange(FIND_SOURCES, {
      filter: (source: Source) => {
        const sourceInfo = Memory.sources[source.id];
        if (!sourceInfo) {
          console.log(
            `getClosestSource(): Source doesn't exist in "Memory.sources".`,
            JSON.stringify({ creep: creep.name, source: source.id })
          );
          return false;
        }
        return filter(sourceInfo, source);
      }
    }) ||
    (creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
      filter: (structure: Structure) => {
        if (structure.structureType !== STRUCTURE_EXTRACTOR) {
          return false;
        }
        const sourceInfo = Memory.sources[structure.id];
        if (!sourceInfo) {
          console.log(
            `getClosestSource(): StructureExtractor doesn't exist in "Memory.sources".`,
            JSON.stringify({ creep: creep.name, source: structure.id })
          );
          return false;
        }
        return filter(sourceInfo, structure as StructureExtractor);
      }
    }) as null | StructureExtractor) ||
    (flag &&
      flag.pos.findClosestByRange(FIND_SOURCES, {
        filter: (source: Source) => {
          const sourceInfo = Memory.sources[source.id];
          if (!sourceInfo) {
            console.log(
              `getClosestSource(): Source doesn't exist in "Memory.sources".`,
              JSON.stringify({ creep: creep.name, source: source.id })
            );
            return false;
          }
          return filter(sourceInfo, source);
        }
      }))
  );
}

export function findSilo(creep: Creep, resourceType: ResourceConstant): null | Structure {
  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      const isStore =
        structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_TOWER ||
        structure.structureType === STRUCTURE_STORAGE ||
        structure.structureType === STRUCTURE_CONTAINER;
      const isSourceContainer =
        structure.structureType === STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 1).length;
      const isMineralContainer =
        structure.structureType === STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_MINERALS, 1).length;
      const freeCapacity = isStore && (structure as any).store.getFreeCapacity(resourceType);
      return isStore && !isSourceContainer && !isMineralContainer && freeCapacity > 0;
    }
  });
}

export interface GetBodyParts {
  base: BodyPartConstant[];
  extra: BodyPartConstant[];
  maxExtra: number;
}

export class BaseCreep {
  public static role: WorkerRoles;
  private drawService = new DrawService(this.creep.room, this.creep.pos);
  public constructor(public creep: Creep) {}
  public static getBodyParts(room: Room): GetBodyParts {
    return { base: [], extra: [], maxExtra: 0 };
  }
  public static isNeedOfMore(room: Room): boolean {
    return true;
  }
  public static getMemory(room: Room): CreepMemory {
    return {
      role: WorkerRoles.truck,
      roomName: room.name
    };
  }
  public say(text: string): void {
    this.drawService.draw(text, { opacity: 0.5, backgroundPadding: 0.2 });
  }
}
