import { BaseCreep, CreepSchema, harvest, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';
import { getRepairTarget } from '../../helpers/repair';
import { pickupEnergy } from '../../helpers/creep+pickup';

export class CreepFlagBuilder extends BaseCreep {
  public static role = WorkerRoles.flagBuilder;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(spawnRoom: Room): false | CreepSchema {
    const flag = Game.flags[CreepFlagBuilder.role];
    if (!flag || !flag.room) {
      return false;
    }

    const creepsAmount = Object.values(Game.creeps).filter(c => c.memory.role === CreepFlagBuilder.role).length;
    if (creepsAmount >= 5) {
      return false;
    }

    const baseBodyParts = [MOVE, CARRY, WORK];
    const bodyParts = { base: baseBodyParts, extra: baseBodyParts, maxExtra: 50 };

    return {
      memory: {
        role: CreepFlagBuilder.role,
        parentRoomName: spawnRoom.name
      },
      bodyParts
    };
  }

  public run(): void {
    const flag = Game.flags[CreepFlagBuilder.role];
    if (flag && flag.room) {
      const targetRoomName = flag.room.name;
      if (this.creep.room.name !== targetRoomName) {
        moveTo(this.creep, flag);
        return;
      }
    }

    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      this.work();
    } else {
      pickupEnergy(this, 300);
    }
  }

  private work() {
    this.build() || this.repair();
  }

  private build(): boolean {
    const target = this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (!target) {
      this.say('⚠️ Build');
      return false;
    }

    this.say('👷‍️');
    const buildResult = this.creep.build(target);
    if (buildResult === OK) {
      return true;
    }
    if (buildResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, target);
      return true;
    }
    console.log(`UNEXPECTED BUILD RESULT: ${buildResult}`);
    return true;
  }

  private repair(): boolean {
    const target =
      getRepairTarget(this.creep.pos, 25) ||
      getRepairTarget(this.creep.pos, 50) ||
      getRepairTarget(this.creep.pos, 75) ||
      getRepairTarget(this.creep.pos, 100);
    if (!target) {
      return false;
    }

    this.say('🔨️');
    const repairResult = this.creep.repair(target);
    if (repairResult === OK) {
      return true;
    }
    if (repairResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, target);
      return true;
    }
    console.log(`UNEXPECTED REPAIR RESULT: ${repairResult}`);
    return false;
  }
}
