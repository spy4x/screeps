import { GetBodyParts, getClosestSource, harvest, BaseCreep, moveTo, CreepSchema } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepExcavator extends BaseCreep {
  public static role = WorkerRoles.excavator;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const source = room.find(FIND_SOURCES, {
      filter: s => {
        const si = Memory.sources[s.id];
        return si.isActive && !si.excavatorName;
      }
    })[0];

    if (!source) {
      return false;
    }

    return {
      memory: {
        role: CreepExcavator.role,
        parentRoomName: room.name,
        sourceId: source.id
      },
      bodyParts: {
        base: source.pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: s => s.structureType === STRUCTURE_LINK }).length
          ? [MOVE, CARRY, WORK, WORK]
          : [MOVE, WORK, WORK],
        extra: [MOVE, WORK, WORK],
        maxExtra: 3
      }
    };
  }

  public run(): void {
    const source = this.getSource();
    if (!source) {
      console.log(`${this.creep.memory.role} ${this.creep.name} couldn't find source`);
      this.say('⚠️');
      return;
    }
    harvest(this.creep, source);
    this.pickup();
    this.drop();
  }

  private getSource(): null | Source {
    const sourceId = this.creep.memory.sourceId as Id<Source>;
    if (sourceId) {
      if (Memory.sources[sourceId].excavatorName !== this.creep.name) {
        Memory.sources[sourceId].excavatorName = this.creep.name;
      }
      return Game.getObjectById(sourceId);
    }
    return null;
  }

  private drop(): void {
    const capacity = this.creep.store.getCapacity(RESOURCE_ENERGY);
    const hasStoreAndNoFreeSpace = capacity > 0 && (capacity - this.creep.store.getFreeCapacity()) / capacity > 0.9;
    if (hasStoreAndNoFreeSpace) {
      // TODO: get link from memory
      const links = this.creep.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: { structureType: STRUCTURE_LINK } });
      if (links.length) {
        this.creep.transfer(links[0], RESOURCE_ENERGY);
      }
    }
  }
  private pickup(): void {
    const droppedResource = this.creep.pos.lookFor(LOOK_RESOURCES)[0];
    if (droppedResource) {
      this.creep.pickup(droppedResource);
    } else {
      const structure = this.creep.pos.lookFor(LOOK_STRUCTURES)[0];
      if (structure instanceof StructureContainer && structure.store.energy) {
        this.creep.withdraw(structure, RESOURCE_ENERGY);
      }
    }
  }
}
