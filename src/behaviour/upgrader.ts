import { HarvestSourceChoice, harvest, moveTo } from '../helpers/creep';

export const roleUpgrader = {
  run: (creep: Creep): void => {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      creep.say('🔄 harvest');
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.say('⚡ upgrade');
      // clearSourceIdForCreep(creep);
    }

    if (creep.memory.working) {
      const controller = creep.room.controller;
      if (!controller) {
        const message = '⚠️ No controller.';
        creep.say(message);
        console.error(`${creep.name}: ${message}`);
        return;
      }
      if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
        moveTo(creep, controller);
      }
    } else {
      harvest(creep, HarvestSourceChoice.closest);
    }
  }
};
