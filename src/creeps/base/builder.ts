import { BaseCreep, CreepSchema, GetBodyParts, moveTo } from '../../helpers/creep';
import { pickupEnergy } from '../../helpers/creep+pickup';
import { WorkerRoles } from '../../helpers/types';
import { getEnergyStorageAmount } from '../../helpers/room';

export class CreepBuilder extends BaseCreep {
  public static role = WorkerRoles.builder;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(): GetBodyParts {
    const base = [MOVE, CARRY, WORK];
    const extra = base;
    return { base, extra, maxExtra: MAX_CREEP_SIZE };
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    if (!constructionSites.length) {
      return false;
    }

    const creepsAmount = room.find(FIND_MY_CREEPS, {
      filter: c => c.memory.role === CreepBuilder.role && (!c.ticksToLive || c.ticksToLive > 50)
    }).length;
    const maxByEnergy = room.storage
      ? Math.floor(getEnergyStorageAmount(room) / 2500) || 1
      : Math.floor((getEnergyStorageAmount(room) || room.energyAvailable) / 100) || 1;
    const maxByContructionNeed =
      Math.floor(
        constructionSites.reduce((acc, cur) => acc + cur.progressTotal - cur.progress, 0) / (room.storage ? 5000 : 1000)
      ) || 1;
    const maxCreeps = _.min([4, maxByEnergy, maxByContructionNeed]);
    if (creepsAmount >= maxCreeps) {
      return false;
    }

    return {
      memory: {
        role: CreepBuilder.role,
        parentRoomName: room.name
      },
      bodyParts: this.getBodyParts()
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
      pickupEnergy(this, 50);
    }
  }

  private work() {
    const target = this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (!target) {
      return;
    }
    this.say('👷‍️');

    const rangeToTarget = this.creep.pos.getRangeTo(target);
    if (rangeToTarget > 3) {
      moveTo(this.creep, target);
    } else {
      const buildResult = this.creep.build(target);
      if (buildResult === OK) {
        return;
      }
      console.log(`UNEXPECTED BUILD RESULT: ${buildResult}`);
    }
  }
}
