import { BaseCreep, moveTo } from './creep';
import { LinkMemoryType } from './types';

export function pickupEnergy(creep: BaseCreep): boolean {
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
    store.store.energy < creep.creep.store.getFreeCapacity(RESOURCE_ENERGY)
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
  const link = creep.pos.findInRange(FIND_MY_STRUCTURES, 3, {
    filter: s => s.structureType === STRUCTURE_LINK && Memory.links[s.id].type !== LinkMemoryType.base
  })[0] as StructureLink;
  if (link) {
    return link;
  }

  const storage = creep.room.storage;
  if (storage) {
    return storage;
  }

  const droppedResource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
    filter: dr => dr.resourceType === RESOURCE_ENERGY && dr.amount > 300
  });
  if (droppedResource) {
    return droppedResource;
  }

  if (creep.room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER })) {
    return creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.energy >= 50
    }) as StructureContainer;
  }

  const spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  if (spawn) {
    return spawn;
  }

  return null;
}
