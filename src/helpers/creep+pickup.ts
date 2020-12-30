import { BaseCreep, moveTo } from './creep';
import { LinkMemoryType, WorkerRoles } from './types';

export function pickupEnergy(creep: BaseCreep, minEnergyToPickup = 0): boolean {
  const store = getSilo(creep.creep);

  if (!store) {
    creep.say('⚠️ pickup');
    return false;
  }

  if (store instanceof Resource) {
    if (creep.creep.pickup(store) === ERR_NOT_IN_RANGE) {
      moveTo(creep.creep, store);
    }
    return true;
  }

  if (
    store.structureType !== STRUCTURE_LINK &&
    store.store.getCapacity(RESOURCE_ENERGY) >= creep.creep.store.getCapacity(RESOURCE_ENERGY) &&
    store.store.energy < (minEnergyToPickup || creep.creep.store.getFreeCapacity(RESOURCE_ENERGY))
  ) {
    creep.say('⚠️ pickup');
    return false;
  }

  creep.say('🛒');
  if (creep.creep.withdraw(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    moveTo(creep.creep, store);
  }
  return true;
}

function getSilo(
  creep: Creep
): null | Resource<ResourceConstant> | (Structure & { store: Store<RESOURCE_ENERGY | ResourceConstant, false> }) {
  if (creep.memory.role === WorkerRoles.flagBuilder) {
    if (creep.room.terminal && creep.room.terminal.store.energy > 3000) {
      return creep.room.terminal;
    }
    if (creep.room.storage && creep.room.storage.store.energy > 3000) {
      return creep.room.storage;
    }
  }
  if (creep.room.storage && creep.pos.getRangeTo(creep.room.storage) <= 3) {
    // to prevent conflict with link at the same distance
    return creep.room.storage;
  }

  const link = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
    filter: s =>
      s.structureType === STRUCTURE_LINK &&
      Memory.links[s.id].type !== LinkMemoryType.base &&
      Memory.links[s.id].type !== LinkMemoryType.source
  })[0] as StructureLink;
  if (link) {
    return link;
  }

  const containerOrStorage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s =>
      (s.structureType === STRUCTURE_CONTAINER && s.store.energy >= 50) ||
      (s.structureType === STRUCTURE_STORAGE && s.store.energy >= 10000)
  }) as StructureContainer | StructureStorage;
  if (containerOrStorage) {
    return containerOrStorage;
  }

  const droppedResource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: dr => dr.resourceType === RESOURCE_ENERGY && dr.amount > 200
  });
  if (droppedResource) {
    return droppedResource;
  }

  const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  if (spawn) {
    return spawn;
  }

  return null;
}
