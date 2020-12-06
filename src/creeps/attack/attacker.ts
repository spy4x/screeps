import { BaseCreep, CreepSchema, GetBodyParts, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepAttacker extends BaseCreep {
  public static role = WorkerRoles.attacker;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const doesFlagExist = !!Game.flags[CreepAttacker.role];
    if (!doesFlagExist) {
      return false;
    }

    const roomLvLEnough = room.controller!.level >= 5;
    if (!roomLvLEnough) {
      return false;
    }

    const maxCreeps = 1;
    const creepsAmount = Object.values(Game.creeps).filter(
      c => c.memory.role === CreepAttacker.role && (!c.ticksToLive || c.ticksToLive > 100)
    ).length;
    if (creepsAmount >= maxCreeps) {
      return false;
    }

    return {
      memory: {
        role: CreepAttacker.role,
        parentRoomName: room.name
      },
      bodyParts: CreepAttacker.getBodyParts(room)
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base = [TOUGH, ATTACK, MOVE, MOVE];
    return {
      base,
      extra: base,
      maxExtra: 11 // 48 parts max (to make sure there are enough move parts)
    };
  }

  public run(): void {
    if ((this.creep.hits * 100) / this.creep.hitsMax < 25) {
      this.returnHome();
      return;
    }
    const flag = Game.flags[CreepAttacker.role];
    if (!flag) {
      this.returnHome();
      return;
    }
    if (this.creep.room.name === flag.room?.name) {
      const target =
        this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
          filter: c => c.body.find(b => b.type === ATTACK || b.type === RANGED_ATTACK)
        }) ||
        this.findTargetStructure(STRUCTURE_TOWER) ||
        this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
        this.findTargetStructure(STRUCTURE_SPAWN) ||
        this.findTargetStructure(STRUCTURE_STORAGE) ||
        this.findTargetStructure(STRUCTURE_EXTENSION) ||
        this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
        this.findTargetStructure();
      if (target) {
        if (this.creep.attack(target) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, target, { reusePath: 1 });
        }
      } else {
        moveTo(this.creep, flag);
      }
    } else {
      moveTo(this.creep, flag);
    }
  }

  private findTargetStructure(structureType?: string): null | Structure {
    return this.creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
      filter: (s: Structure) =>
        structureType ? s.structureType === structureType : s.structureType !== STRUCTURE_CONTROLLER
    });
  }

  private returnHome() {
    if (this.creep.room.name === this.creep.memory.parentRoomName) {
      moveTo(
        this.creep,
        this.creep.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER })[0]
      );
    } else {
      moveTo(this.creep, new RoomPosition(42, 26, this.creep.memory.sourceId!));
    }
  }
}
