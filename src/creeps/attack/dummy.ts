import { BaseCreep, CreepSchema, GetBodyParts, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepDummy extends BaseCreep {
  public static role = WorkerRoles.dummy;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    return false;
    // const roomLvLEnough = room.controller!.level >= 2;
    // const notEnoughCreeps = Object.values(Game.creeps).filter(c => c.memory.role === CreepDummy.role).length < 20;
    // return roomLvLEnough && notEnoughCreeps && !!Game.flags[CreepDummy.role];
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepDummy.role,
      parentRoomName: room.name
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const amount = 2;
    const toughParts = new Array(amount).fill(TOUGH) as BodyPartConstant[];
    const moveParts = new Array(amount).fill(MOVE) as BodyPartConstant[];
    const base = [...toughParts, ...moveParts];
    return { base, extra: base, maxExtra: 0 };
  }

  public run(): void {
    const flag = Game.flags[CreepDummy.role];
    if (!flag) {
      this.returnHome();
      return;
    } else {
      // if (this.creep.pos.findPathTo(flag).length > 2) {
      moveTo(this.creep, flag);
      // }
    }
  }

  private findTargetStructure(structureType?: string): null | Structure {
    const opts = {
      filter: (s: Structure) => s.structureType === structureType
    };
    return this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, structureType ? opts : undefined);
  }

  private returnHome() {
    moveTo(this.creep, new RoomPosition(42, 26, this.creep.memory.parentRoomName!));
  }
}
