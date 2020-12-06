import { BaseCreep, CreepSchema, GetBodyParts, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepScout extends BaseCreep {
  public static role = WorkerRoles.scout;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const doesFlagExist = !!Game.flags[CreepScout.role];
    if (!doesFlagExist) {
      return false;
    }

    const creepsAmount = Object.values(Game.creeps).filter(
      c => c.memory.role === CreepScout.role && (!c.ticksToLive || c.ticksToLive > 100)
    ).length;
    if (creepsAmount >= 1) {
      return false;
    }

    return {
      memory: {
        role: CreepScout.role,
        parentRoomName: room.name
      },
      bodyParts: this.getBodyParts()
    };
  }

  public static getBodyParts(): GetBodyParts {
    return { base: [MOVE], extra: [], maxExtra: 0 };
  }

  public run(): void {
    const flag = Game.flags[CreepScout.role];
    if (!flag) {
      this.say('⚠️');
      return;
    }
    const room = flag.room;
    if (!room) {
      return;
    }
    const roomName = room.name;

    if (this.creep.room.name === roomName) {
      moveTo(this.creep, flag);
    } else {
      this.say('🏇️');
      moveTo(this.creep, new RoomPosition(20, 20, roomName));
    }
  }
}
