import { GetBodyParts, getClosestSource, harvest, BaseCreep, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepExcavator extends BaseCreep {
  public static role = WorkerRoles.excavator;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(): boolean {
    return !!Object.keys(Memory.sources).find(sourceId => {
      const sourceInfo = Memory.sources[sourceId];
      return sourceInfo.isActive && !sourceInfo.excavatorName;
    });
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepExcavator.role,
      sourceId: null,
      working: false
    };
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base: BodyPartConstant[] = room.controller!.level < 5 ? [MOVE, WORK, WORK] : [MOVE, CARRY, WORK, WORK];
    const extra = [WORK];
    return { base, extra, maxExtra: 4 };
  }

  public run(): void {
    const source = this.getSource();
    if (!source) {
      this.creep.memory.sourceId = null;
      this.say('⚠️');
      return;
    }
    this.pickup();
    this.drop();
    harvest(this.creep, Game.getObjectById(this.creep.memory.sourceId as Id<Source>)!);
    this.drop();
    this.pickup();
  }

  private getSource(): null | SourceInfo {
    if (this.creep.memory.sourceId) {
      return Memory.sources[this.creep.memory.sourceId];
    } else {
      const sourceId = Object.keys(Memory.sources).find(sid => {
        const sourceInfo = Memory.sources[sid];
        return sourceInfo.isActive && !sourceInfo.excavatorName;
      });
      if (sourceId) {
        this.creep.memory.sourceId = sourceId;
        Memory.sources[sourceId].excavatorName = this.creep.name;
        return Memory.sources[sourceId];
      } else {
        console.log(`Excavator ${this.creep.name} couldn't find source`);
        return null;
      }
    }
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
