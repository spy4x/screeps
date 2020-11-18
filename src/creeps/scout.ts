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
      sourceId: 'E49N25',
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
    const controller = this.creep.room.controller!;

    if (this.creep.room.name === roomName) {
      moveTo(this.creep, controller);
      if (controller.owner && !controller.my) {
        const attackControllerResult = this.creep.attackController(controller);
        if (attackControllerResult === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, controller);
        } else if (attackControllerResult !== ERR_TIRED && attackControllerResult !== OK) {
          console.log(`Scout: attack result: ${attackControllerResult}`);
        }
      } else {
        const claimControllerResult = this.creep.claimController(controller);
        if (claimControllerResult === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, controller);
        } else if (claimControllerResult === ERR_GCL_NOT_ENOUGH) {
          if (this.creep.reserveController(controller) === ERR_NOT_IN_RANGE) {
            moveTo(this.creep, controller);
          }
        } else {
          console.log(`Scout: claim result: ${claimControllerResult}`);
        }
      }
    } else {
      this.say('🏇️');
      moveTo(this.creep, new RoomPosition(20, 20, roomName));
    }
  }
}
