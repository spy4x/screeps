import { GetBodyParts, getClosestSource, harvest, BaseCreep, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepExcavator extends BaseCreep {
  public static role = WorkerRoles.excavator;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): boolean {
    const filter = (s: Source | StructureExtractor) => {
      const si = Memory.sources[s.id];
      return si.isActive && !si.excavatorName;
    };
    return (
      !!room.find(FIND_SOURCES, { filter }).length ||
      !!room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTRACTOR && filter(s) }).length
    );
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepExcavator.role,
      roomName: room.name
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base: BodyPartConstant[] = room.controller!.level < 5 ? [MOVE, WORK, WORK] : [MOVE, CARRY, WORK, WORK];
    const extra = [WORK];
    return { base, extra, maxExtra: 5 };
  }

  public run(): void {
    const source = this.getSource();
    if (!source) {
      this.creep.memory.sourceId = undefined;
      this.say('⚠️');
      return;
    }
    this.pickup();
    this.drop();
    harvest(this.creep, source);
    this.drop();
    this.pickup();
  }

  private getSource(): null | Source | StructureExtractor {
    if (this.creep.memory.sourceId) {
      return Game.getObjectById(this.creep.memory.sourceId);
    }

    const source = getClosestSource(this.creep, si => si.isActive && !si.excavatorName);

    if (source) {
      this.creep.memory.sourceId = source.id;
      Memory.sources[source.id].excavatorName = this.creep.name;
    } else {
      console.log(`Excavator ${this.creep.name} couldn't find source`);
    }

    return source;
  }

  private drop(): void {
    const capacity = this.creep.store.getCapacity(RESOURCE_ENERGY);
    const hasStoreAndNoFreeSpace = capacity > 0 && (capacity - this.creep.store.getFreeCapacity()) / capacity > 0.9;
    if (hasStoreAndNoFreeSpace) {
      const links = this.creep.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: { structureType: STRUCTURE_LINK } });
      if (links.length) {
        this.creep.transfer(links[0], RESOURCE_ENERGY);
      }
    }
  }
  private pickup(): void {
    const droppedResource = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 0)[0];
    if (droppedResource) {
      this.creep.pickup(droppedResource);
    } else {
      const container = this.creep.pos.findInRange(FIND_STRUCTURES, 0, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      })[0] as StructureContainer;
      if (container?.store.energy) {
        this.creep.withdraw(container, RESOURCE_ENERGY);
      }
    }
  }
}
