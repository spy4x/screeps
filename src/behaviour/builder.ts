import { HarvestSourceChoice, harvest, moveTo } from '../helpers/creep';
import { clearSourceIdForCreep } from '../helpers/source';

export const roleBuilder = {
  run: (creep: Creep): void => {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('🏗️ build');
      clearSourceIdForCreep(creep);
    }

    if (creep.memory.working) {
      work(creep);
    } else {
      harvest(creep, HarvestSourceChoice.free);
    }
  }
};

export function getConstructionSite(creep: Creep): null | ConstructionSite {
  return creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
}

function work(creep: Creep): void {
  const target = getConstructionSite(creep);
  if (!target) {
    creep.say('No target');
    return;
  }
  if (creep.build(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target);
  }
}
