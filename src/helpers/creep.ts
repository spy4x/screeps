import { getAssignedSource } from './source';
import { WorkerRoles } from './types';

export const createName = (role: WorkerRoles): string => {
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const name = `${role.substr(0, 1)}${i}`;
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
    case WorkerRoles.harvester:
      return '#fff200'; // gold
    case WorkerRoles.upgrader:
      return '#ea00ff'; // violet
    case WorkerRoles.builder:
      return '#0062ff'; // blue
    case WorkerRoles.repairer:
      return '#00ffd9'; // cyan
    default:
      return '#FF0000'; // red
  }
}

export function moveTo(
  creep: Creep,
  target: RoomPosition | { pos: RoomPosition }
): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
  return creep.moveTo(target, {
    visualizePathStyle: { stroke: getPathColorForRole(creep.memory.role as WorkerRoles), opacity: 0.8 }
  });
}

export enum HarvestSourceChoice {
  closest = 'closest',
  free = 'free'
}

export function harvest(creep: Creep, sourceChoice: HarvestSourceChoice): void {
  const source =
    sourceChoice === HarvestSourceChoice.free
      ? getAssignedSource(creep)
      : creep.pos.findClosestByPath(FIND_SOURCES) || creep.pos.findClosestByRange(FIND_SOURCES);
  if (!source) {
    creep.say('⚠️ No source');
    return;
  }
  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    moveTo(creep, source);
  }
}

export function findSilo(creep: Creep): null | Structure {
  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      const isStore =
        structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_TOWER ||
        structure.structureType === STRUCTURE_CONTAINER;
      return isStore && (structure as any).store.getFreeCapacity(RESOURCE_ENERGY) > 0;
    }
  });
}
