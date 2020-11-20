import { BaseCreep, moveTo } from './creep';

export function pickup(creep: BaseCreep): boolean {
  const store = getDefaultPickupStore(creep.creep) || getAlternativePickupStore(creep.creep);
  if (!store) {
    creep.say('⚠️ pickup');
    return false;
  }
  creep.say('🛒');
  if (creep.creep.withdraw(store, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    moveTo(creep.creep, store);
  }
  return true;
}

function getDefaultPickupStore(creep: Creep): null | Structure {
  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      if (!isStoreType(structure)) {
        return false;
      }

      return (structure as any).store[RESOURCE_ENERGY] > 0;
    }
  });
}

function getAlternativePickupStore(creep: Creep): null | Structure {
  const doesStoreExist = creep.room.find(FIND_STRUCTURES, { filter: s => isStoreType(s) });
  if (doesStoreExist.length) {
    return null; // wait for store to be filled
  }
  // take from Spawn as a fallback
  return creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_SPAWN });
}

function isStoreType(structure: Structure): boolean {
  const isStore = structure.structureType === STRUCTURE_STORAGE || structure.structureType === STRUCTURE_CONTAINER;
  const isSourceContainer =
    structure.structureType === STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 1).length;
  return isStore && !isSourceContainer;
}
