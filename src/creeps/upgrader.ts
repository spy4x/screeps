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
    const extra = [CARRY, WORK, WORK, WORK];
    return { base, extra, maxExtra: MAX_CREEP_SIZE };
  }

  public static isNeedOfMore(room: Room): boolean {
    if (!room.controller) {
      return false;
    }
    const isLackingCreeps =
      room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === CreepUpgrader.role }).length <
      room.find(FIND_MY_SPAWNS)[0]?.pos.findPathTo(room.controller).length / 12;
    return isLackingCreeps;
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepUpgrader.role,
      sourceId: null,
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
}
