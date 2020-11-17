import { BaseCreep, GetBodyParts, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepScout extends BaseCreep {
  public static role = WorkerRoles.scout;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(): boolean {
    return false;
    // const noOtherScout = !Object.values(Game.creeps).filter(c => c.memory.role === CreepScout.role).length;
    // return noOtherScout;
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepScout.role,
      sourceId: 'E48N24',
      working: false
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    return { base: [MOVE, CLAIM], extra: [], maxExtra: 0 };
  }

  public run(): void {
    const roomName = this.creep.memory.sourceId;
    if (!roomName) {
      this.say('⚠️');
      return;
    }
    if (this.creep.room.name === roomName) {
      moveTo(this.creep, this.creep.room.controller!);
      if (this.creep.claimController(this.creep.room.controller!) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, this.creep.room.controller!);
      }
    } else {
      moveTo(this.creep, new RoomPosition(1, 1, roomName));
    }
  }
}
