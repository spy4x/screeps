import { HarvestSourceChoice, harvest, moveTo } from '../helpers/creep';
import { clearSourceIdForCreep } from '../helpers/source';

export const roleRepairer = {
  run: (creep: Creep): void => {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('🔧 repair');
      clearSourceIdForCreep(creep);
    }

    if (creep.memory.working) {
      const target = getRepairTarget(creep, 25) || getRepairTarget(creep);
      if (!target) {
        creep.memory.working = false;
        creep.say('No target');
        return;
      }
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        moveTo(creep, target);
      }
    } else {
      harvest(creep, HarvestSourceChoice.free);
    }
  }
};

export function getRepairTarget(creep: Creep, healthPercentage = 100): null | Structure {
  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => getRepairFilter(structure, healthPercentage)
  });
}

export function getRepairFilter(structure: Structure, healthPercentage = 100): boolean {
  return structure.structureType === STRUCTURE_ROAD && healthFilter(structure, healthPercentage);
}

function healthFilter(structure: Structure, healthPercentage: number): boolean {
  return healthPercentage === 100
    ? structure.hits < structure.hitsMax
    : (structure.hits / structure.hitsMax) * 100 < healthPercentage;
}
