import { BaseCreep, GetBodyParts, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepTowerDrainer extends BaseCreep {
  public static role = WorkerRoles.towerDrainer;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): boolean {
    return false;
    // const roomLvLEnough = room.controller!.level >= 5;
    // const notEnoughCreeps = Object.values(Game.creeps).filter(c => c.memory.role === CreepTowerDrainer.role).length < 1;
    // return roomLvLEnough && notEnoughCreeps && !!Game.flags[CreepTowerDrainer.role];
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepTowerDrainer.role,
      sourceId: room.name,
      working: false
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const amount = 8;
    const toughParts = new Array(amount).fill(TOUGH) as BodyPartConstant[];
    const healParts = new Array(amount / 2).fill(HEAL) as BodyPartConstant[];
    const moveParts = new Array(amount * 1.5).fill(MOVE) as BodyPartConstant[];
    return { base: [...toughParts, ...healParts, ...moveParts], extra: [], maxExtra: 0 };
  }

  public run(): void {
    const flag = Game.flags[CreepTowerDrainer.role];
    if (!flag) {
      this.returnHome();
      return;
    }
    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
      this.returnHome();
    } else {
      // go to other room to drain tower
      if (flag /* && this.creep.room.name !== flag.room?.name*/) {
        moveTo(this.creep, flag);
      }
    }
  }

  private returnHome() {
    const flag = Game.flags[`${CreepTowerDrainer.role}_backup`];
    if (flag) {
      if (this.creep.room.name === flag.room!.name) {
        if (this.creep.pos.findPathTo(flag).length > 1) {
          moveTo(this.creep, flag);
        } else {
          this.heal();
        }
      } else {
        moveTo(this.creep, flag);
      }
    } else {
      if (this.creep.room.name === this.creep.memory.sourceId!) {
        this.heal();
      } else {
        moveTo(this.creep, new RoomPosition(42, 26, this.creep.memory.sourceId!));
      }
    }
  }

  private heal() {
    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    } else {
      const target = this.creep.pos.findInRange(FIND_MY_CREEPS, 2, { filter: c => c.hits < c.hitsMax })[0];
      if (target) {
        if (this.creep.heal(target) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, target);
        }
      }
    }
  }
}
