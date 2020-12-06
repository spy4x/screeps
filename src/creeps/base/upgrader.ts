import { BaseCreep, CreepSchema, GetBodyParts, moveTo } from '../../helpers/creep';
import { pickupEnergy } from '../../helpers/creep+pickup';
import { WorkerRoles } from '../../helpers/types';
import { getEnergyStorageAmount } from '../../helpers/room';

export class CreepUpgrader extends BaseCreep {
  public static role = WorkerRoles.upgrader;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    if (!room.controller) {
      return false;
    }
    const creepsAmount = room.find(FIND_MY_CREEPS, {
      filter: c => c.memory.role === CreepUpgrader.role && (!c.ticksToLive || c.ticksToLive > 50)
    }).length;
    const maxByEnergy = Math.floor(getEnergyStorageAmount(room) / 5000) || 1;
    const maxCreeps = _.min([4, maxByEnergy]);
    if (creepsAmount >= maxCreeps) {
      return false;
    }

    const base = [MOVE, CARRY, WORK];
    const extra = CreepUpgrader.getToSilo(room) > 5 ? base : [CARRY, WORK, WORK, WORK];
    const bodyParts = { base, extra, maxExtra: getEnergyStorageAmount(room) > 10000 ? MAX_CREEP_SIZE : 2 };

    return {
      memory: {
        role: CreepUpgrader.role,
        parentRoomName: room.name,
        working: false
      },
      bodyParts
    };
  }

  public run(): void {
    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      this.work();
    } else {
      pickupEnergy(this);
    }
  }

  private work() {
    const controller = this.creep.room.controller;
    if (!controller) {
      const message = '⚠️ No controller';
      this.say(message);
      console.error(`${this.creep.name}: ${message}`);
      return;
    }
    this.say('⚡');
    if (this.creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, controller);
    }
  }

  private static getToSilo(room: Room): number {
    return (room.storage || room.find(FIND_MY_SPAWNS)[0])?.pos.getRangeTo(room.controller!);
  }
}
