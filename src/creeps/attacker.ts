import { BaseCreep, GetBodyParts, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepAttacker extends BaseCreep {
  public static role = WorkerRoles.attacker;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): boolean {
    return false;
    // const roomLvLEnough = room.controller!.level >= 5;
    // const notEnoughCreeps = Object.values(Game.creeps).filter(c => c.memory.role === CreepAttacker.role).length < 1;
    // return roomLvLEnough && notEnoughCreeps && !!Game.flags[CreepAttacker.role];
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepAttacker.role,
      roomName: room.name
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const amount = 5;
    const toughParts = new Array(amount).fill(TOUGH) as BodyPartConstant[];
    const attackParts = new Array(amount).fill(ATTACK) as BodyPartConstant[];
    const moveParts = new Array(amount * 2).fill(MOVE) as BodyPartConstant[];
    const base = [...toughParts, ...attackParts, ...moveParts];
    return { base, extra: base, maxExtra: MAX_CREEP_SIZE };
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
    if (this.creep.room.name === this.creep.memory.roomName) {
      moveTo(
        this.creep,
        this.creep.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER })[0]
      );
    } else {
      moveTo(this.creep, new RoomPosition(42, 26, this.creep.memory.sourceId!));
    }
  }
}
