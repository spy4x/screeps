import { BaseCreep, CreepSchema, GetBodyParts, harvest } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepMineralExcavator extends BaseCreep {
  public static role = WorkerRoles.mineralExcavator;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const extractor = room.find(FIND_MY_STRUCTURES, {
      filter: s => {
        if (s.structureType !== STRUCTURE_EXTRACTOR) {
          return false;
        }
        const si = Memory.sources[s.id];
        return si.isActive && !si.excavatorName;
      }
    })[0];
    if (!extractor || !extractor.isActive || !extractor.pos.lookFor(LOOK_MINERALS)[0]?.mineralAmount) {
      return false;
    }

    return {
      memory: {
        role: CreepMineralExcavator.role,
        parentRoomName: room.name,
        sourceId: extractor.id
      },
      bodyParts: this.getBodyParts(room)
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base = [MOVE, WORK, WORK];
    return { base, extra: base, maxExtra: MAX_CREEP_SIZE - base.length };
  }

  public run(): void {
    const source = this.getSource();
    if (!source) {
      console.log(`MineralExcavator ${this.creep.name} couldn't find source`);
      this.say('⚠️');
      return;
    }
    harvest(this.creep, source);
  }

  private getSource(): null | StructureExtractor {
    const sourceId = this.creep.memory.sourceId as Id<StructureExtractor>;
    if (sourceId) {
      if (Memory.sources[sourceId].excavatorName !== this.creep.name) {
        Memory.sources[sourceId].excavatorName = this.creep.name;
      }
      return Game.getObjectById(sourceId);
    }
    return null;
  }
}
