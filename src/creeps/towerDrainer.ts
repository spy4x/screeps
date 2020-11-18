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
    // const notEnoughCreeps =
    //   Object.values(Game.creeps).filter(c => c.memory.role === CreepTowerDrainer.role).length < 1;
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
    const amount = 3;
    const toughParts = new Array(amount).fill(TOUGH) as BodyPartConstant[];
    const moveParts = new Array(amount).fill(MOVE) as BodyPartConstant[];
    return { base: [...toughParts, ...moveParts], extra: [], maxExtra: 0 };
  }

  public run(): void {
    const flag = Game.flags[CreepTowerDrainer.role];
    if (!flag) {
      this.returnHome();
      return;
    }
    if (this.creep.hits < this.creep.hitsMax) {
      this.returnHome();
    } else {
      // go to other room to drain tower
      if (flag && this.creep.room.name !== flag.room?.name) {
        moveTo(this.creep, flag);
      }
    }
  }

  private returnHome() {
    if (this.creep.room.name === this.creep.memory.sourceId!) {
      moveTo(
        this.creep,
        this.creep.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER })[0]
      );
    } else {
      moveTo(this.creep, new RoomPosition(20, 20, this.creep.memory.sourceId!));
    }
  }
}
