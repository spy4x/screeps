import { HarvestSourceChoice, harvest, moveTo, findSilo } from '../helpers/creep';
import { clearSourceIdForCreep } from '../helpers/source';

export const roleHarvester = {
  run: (creep: Creep): void => {
    if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = false;
      creep.say('🛒 carry');
      clearSourceIdForCreep(creep);
    }
    if (!creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = true;
      creep.say('🔄 harvest');
    }

    if (creep.memory.working) {
      harvest(creep, HarvestSourceChoice.free);
    } else {
      const silo = findSilo(creep);
      if (silo) {
        if (creep.transfer(silo, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(creep, silo);
        }
      } else {
        creep.say('⚠️ No silo');
        if (creep.store.getFreeCapacity() !== 0) {
          creep.memory.working = true; // harvest some more resources to keep them ready inside
        }
      }
    }
  }
};
