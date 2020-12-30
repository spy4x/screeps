import { BaseCreep, CreepSchema, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepRemoteGuard extends BaseCreep {
  public static role = WorkerRoles.remoteGuard;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const targetRoomName = Object.keys(Memory.remoteHarvestingInRoom).find(roomName => {
      const rh = Memory.remoteHarvestingInRoom[roomName];
      return rh.isActive && !rh.guardName && rh.mainRoomName === room.name;
    });
    if (!targetRoomName) {
      return false;
    }

    const targetRoom = Game.rooms[targetRoomName];
    if (targetRoom) {
      const isHostileCreepInTheRoom =
        targetRoom.find(FIND_HOSTILE_CREEPS, {
          filter: c => c.body.find(b => b.type === ATTACK || (b.type === RANGED_ATTACK && b.hits > 0))
        }).length > 0;
      if (!isHostileCreepInTheRoom) {
        const isHostileBuildingInTheRoom = targetRoom.find(FIND_HOSTILE_STRUCTURES).length > 0;
        if (!isHostileBuildingInTheRoom) {
          return false;
        }
      }
    }
    const base = [
      TOUGH,
      TOUGH,
      TOUGH,
      TOUGH,
      ATTACK,
      ATTACK,
      ATTACK,
      ATTACK,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE,
      MOVE
    ];
    return {
      memory: {
        role: CreepRemoteGuard.role,
        parentRoomName: room.name,
        targetRoomName
      },
      bodyParts: { base, extra: [], maxExtra: 0 }
    };
  }

  public run(): void {
    const roomName = this.creep.memory.targetRoomName;
    if (!roomName) {
      return;
    }
    Memory.remoteHarvestingInRoom[roomName].guardName = this.creep.name;

    const target =
      this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
      this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES);
    if (target) {
      if (this.creep.attack(target) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, target, { reusePath: 1 });
      }
    } else {
      this.say('💂‍♂');
      moveTo(this.creep, new RoomPosition(25, 25, roomName));
    }
  }
}
