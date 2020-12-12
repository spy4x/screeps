import { BaseCreep, CreepSchema, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';
import { runFromHostileCreeps } from '../../helpers/runFromHostileCreeps';

export class CreepClaimer extends BaseCreep {
  public static role = WorkerRoles.claimer;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const targetRoomName = Object.keys(Memory.remoteHarvestingInRoom).find(roomName => {
      const rh = Memory.remoteHarvestingInRoom[roomName];
      return rh.isActive && !rh.claimerName && rh.mainRoomName === room.name;
    });
    if (!targetRoomName) {
      return false;
    }

    return {
      memory: {
        role: CreepClaimer.role,
        parentRoomName: room.name,
        targetRoomName
      },
      bodyParts: { base: [MOVE, CLAIM], extra: Math.random() > 0.7 ? [MOVE, CLAIM] : [], maxExtra: 1 }
    };
  }

  public run(): void {
    if (runFromHostileCreeps(this)) {
      return;
    }

    const roomName = this.creep.memory.targetRoomName;
    if (!roomName) {
      return;
    }
    Memory.remoteHarvestingInRoom[roomName].claimerName = this.creep.name;

    if (this.creep.room.name === roomName) {
      const controller = this.creep.room.controller;
      if (!controller) {
        return;
      }

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
          console.log(`${this.creep.memory.role} ${this.creep.name}: Claim result: ${claimControllerResult}`);
        }
      }
    } else {
      this.say('🏇️');
      moveTo(this.creep, new RoomPosition(20, 20, roomName));
    }
  }
}
