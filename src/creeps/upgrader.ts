import { GetBodyParts, BaseCreep, moveTo } from '../helpers/creep';
import { pickup } from '../helpers/creep+pickup';
import { WorkerRoles } from '../helpers/types';

export class CreepUpgrader extends BaseCreep {
  public static role = WorkerRoles.upgrader;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base = [MOVE, CARRY, WORK];
    let extra: BodyPartConstant[];
    if (
      CreepUpgrader.getDistanceFromStorageOrSwawnToController(room) > 5 &&
      !room.controller!.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: s => s.structureType === STRUCTURE_LINK })
        .length
    ) {
      extra = base;
    } else {
      extra = [CARRY, WORK, WORK, WORK];
    }
    return { base, extra, maxExtra: room.storage?.store.energy ?? 0 > 50000 ? MAX_CREEP_SIZE : 2 };
  }

  public static isNeedOfMore(room: Room): boolean {
    if (!room.controller) {
      return false;
    }
    const currentAmountOfCreeps = room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === CreepUpgrader.role })
      .length;
    const maxAmountOfCreeps = _.min([3, Math.ceil(CreepUpgrader.getDistanceFromStorageOrSwawnToController(room) / 12)]);
    const isLackingCreeps = currentAmountOfCreeps < maxAmountOfCreeps;
    return isLackingCreeps;
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepUpgrader.role,
      roomName: room.name,
      working: false
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
      pickup(this);
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

  private static getDistanceFromStorageOrSwawnToController(room: Room): number {
    return (room.storage || room.find(FIND_MY_SPAWNS)[0])?.pos.getRangeTo(room.controller!);
  }
}
