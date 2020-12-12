import { WorkerRoles } from './types';
import { DrawService } from './draw.service';

export function getRoleShortName(role: WorkerRoles): string {
  switch (role) {
    case WorkerRoles.towerDrainer:
      return '😅';
    case WorkerRoles.builder:
      return '👷';
    case WorkerRoles.remoteBuilder:
      return '🚀👷';
    case WorkerRoles.upgrader:
      return '⚡';
    case WorkerRoles.excavator:
      return '⛏️';
    case WorkerRoles.mineralExcavator:
      return '⛏💎';
    case WorkerRoles.remoteExcavator:
      return '🚀⛏️';
    case WorkerRoles.truck:
      return '🚚';
    case WorkerRoles.remoteTruck:
      return '🚀🚚';
    case WorkerRoles.balancer:
      return '⚖️';
    case WorkerRoles.claimer:
      return '🏇';
    case WorkerRoles.scout:
      return '🤠';
    case WorkerRoles.attacker:
      return '⚔️';
    case WorkerRoles.remoteGuard:
      return '💂‍♂️️️';
    case WorkerRoles.dummy:
      return '😱';
    case WorkerRoles.linker:
      return '🔗';
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
    case WorkerRoles.remoteExcavator:
    case WorkerRoles.mineralExcavator:
      return '#fff200'; // gold
    case WorkerRoles.truck:
    case WorkerRoles.remoteTruck:
      return '#aaff00'; // bright yellow
    case WorkerRoles.upgrader:
      return '#ea00ff'; // violet
    case WorkerRoles.builder:
    case WorkerRoles.remoteBuilder:
      return '#0062ff'; // blue
    case WorkerRoles.balancer:
    case WorkerRoles.linker:
      return '#00ffd9'; // cyan
    case WorkerRoles.claimer:
    case WorkerRoles.scout:
      return '#a87332'; // orange
    case WorkerRoles.towerDrainer:
      return '#FF0000'; // red
    case WorkerRoles.attacker:
    case WorkerRoles.remoteGuard:
      return '#FF0000'; // red
    case WorkerRoles.dummy:
      return '#00ffd9'; // cyan
  }
}

export function harvest(creep: Creep, source: Source | StructureExtractor): void {
  const target = source instanceof Source ? source : source.pos.lookFor(LOOK_MINERALS)[0];
  const container = target.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_CONTAINER
  })[0];
  if (container && !creep.pos.isEqualTo(container)) {
    moveTo(creep, container);
    return;
  }
  const harvestResult = creep.harvest(target);
  if (harvestResult === ERR_NOT_IN_RANGE) {
    moveTo(creep, source);
  } else if (
    harvestResult !== OK &&
    harvestResult !== ERR_BUSY &&
    harvestResult !== ERR_NOT_ENOUGH_RESOURCES &&
    harvestResult !== ERR_TIRED
  ) {
    console.log(`harvest(): Error: ${creep.room.name} ${creep.name} Result: ${harvestResult}`);
  }
}

export function moveTo(
  creep: Creep,
  target: RoomPosition | { pos: RoomPosition } | { pos: { x: number; y: number; roomName: string } },
  opts?: MoveToOpts
): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
  const visualizePathStyle = Memory.shouldDraw
    ? { stroke: getPathColorForRole(creep.memory.role as WorkerRoles), opacity: 0.8 }
    : undefined;
  const roomPos =
    target instanceof RoomPosition || target.pos instanceof RoomPosition
      ? (target as RoomPosition)
      : new RoomPosition(target.pos.x, target.pos.y, target.pos.roomName);
  return creep.moveTo(roomPos, {
    visualizePathStyle,
    ...opts
  });
}

export function findResourceToTransfer({ store }: { store: Store<ResourceConstant, false> }): null | ResourceConstant {
  const storeKeys = Object.keys(store);
  return (
    (storeKeys.find(key => key !== RESOURCE_ENERGY && store[key as ResourceConstant] > 0)! as ResourceConstant) ||
    (storeKeys.find(key => store[key as ResourceConstant] > 0)! as ResourceConstant)
  );
}

export function transfer(
  creep: Creep,
  target: Creep | PowerCreep | Structure,
  resourceType: ResourceConstant = RESOURCE_ENERGY
): boolean {
  const transferResult = creep.transfer(target, resourceType);
  if (transferResult === OK) {
    return true;
  } else if (transferResult === ERR_NOT_IN_RANGE) {
    moveTo(creep, target);
  } else {
    console.log(
      `Creep ${creep.name} transfer result of ${resourceType} to ${
        (target as Creep).name || `${(target as Structure).structureType} ${target.id}`
      } failed with error ${transferResult}`
    );
  }
  return false;
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
        structure.structureType === STRUCTURE_LINK ||
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
export interface CreepSchema {
  bodyParts: GetBodyParts;
  memory: CreepMemory;
}

export class BaseCreep {
  public static role: WorkerRoles;
  private drawService = new DrawService(this.creep.room, this.creep.pos);
  public constructor(public creep: Creep) {}
  public static isNeedOfMore(room: Room): false | CreepSchema {
    return false;
  }
  public say(text: string): void {
    this.drawService.draw(text, { opacity: 0.5, backgroundPadding: 0.2 });
  }
}
