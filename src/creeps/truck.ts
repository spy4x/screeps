import { GetBodyParts, BaseCreep, findSilo, moveTo, getClosestSource } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepTruck extends BaseCreep {
  public static role = WorkerRoles.truck;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(room: Room): GetBodyParts {
    const base = [MOVE, CARRY];
    const extra = room.controller!.level < 5 ? base : [MOVE, CARRY, CARRY];
    return { base, extra, maxExtra: 2 };
  }

  public static isNeedOfMore(room: Room): boolean {
    const sourcesLackingTrucks = room.find(FIND_SOURCES, {
      filter: s => CreepTruck.sourceFilter(Memory.sources[s.id])
    });
    const extractorsLackingTrucks = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTRACTOR && CreepTruck.sourceFilter(Memory.sources[s.id])
    });
    return !!sourcesLackingTrucks.length || !!extractorsLackingTrucks.length;
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepTruck.role,
      roomName: room.name
    };
  }

  public run(): void {
    if (this.creep.memory.working && this.creep.store.getUsedCapacity() === 0) {
      this.creep.memory.working = false;
      this.say('🔜');
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
      this.say('🔙');
    }
    if (this.creep.memory.working) {
      this.get$ToBase();
    } else {
      this.get$FromSource();
    }
  }

  private get$ToBase() {
    const resourceType = Object.keys(this.creep.store).find(
      key => this.creep.store[key as ResourceConstant] > 0
    )! as ResourceConstant;
    const silo = findSilo(this.creep, resourceType);
    if (silo) {
      const transferResult = this.creep.transfer(silo, resourceType);
      if (transferResult === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, silo);
      } else if (transferResult === OK) {
        if (this.creep.store.getUsedCapacity() === 0) {
          this.get$FromSource();
        }
      } else {
        console.log(
          'CreepTruck.get$ToBase():',
          `Unexpected transfer result: ${transferResult}. ResourceType to transfer: ${resourceType}. Silo ${silo.id}`
        );
      }
    } else {
      this.say('⚠️');
      if (this.creep.store.getFreeCapacity() !== 0) {
        this.creep.memory.working = false; // get some more resources to keep them ready inside
      }
    }
  }

  private get$FromSource() {
    const source = this.getSource();
    if (!source) {
      this.say('⚠️');
      return;
    }

    const tombstone = source.pos.findInRange(FIND_TOMBSTONES, 3, { filter: t => t.store.energy })[0];
    if (tombstone) {
      this.say(`☠️`);
      if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, tombstone);
      }
      return;
    }

    const droppedResource = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
    if (droppedResource) {
      this.say('💎');
      // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
      if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, droppedResource);
      }
      return;
    }

    const ruin = source.pos.findInRange(FIND_RUINS, 3, { filter: t => t.store.energy })[0];
    if (ruin) {
      this.say(`🏚️`);
      if (this.creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, ruin);
      }
      return;
    }

    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0] as StructureContainer;
    if (container?.store.getUsedCapacity()) {
      this.say('🛒');
      let resourceType: ResourceConstant;
      if (source instanceof StructureExtractor) {
        resourceType = source.pos.lookFor(LOOK_MINERALS)[0].mineralType;
      } else {
        resourceType = RESOURCE_ENERGY;
      }
      if (this.creep.withdraw(container, resourceType) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, container);
      }
      return;
    }

    this.say('💤');
  }

  private getSource(): null | Source | StructureExtractor {
    if (this.creep.memory.sourceId) {
      return Game.getObjectById(this.creep.memory.sourceId);
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const source = getClosestSource(this.creep, CreepTruck.sourceFilter);

    if (source) {
      this.creep.memory.sourceId = source.id;
      Memory.sources[source.id].truckNames.push(this.creep.name);
    } else {
      console.log(`Truck ${this.creep.name} couldn't find source`);
    }

    return source;
  }

  private static sourceFilter(si: SourceInfo): boolean {
    return (
      si.isActive &&
      !!si.excavatorName &&
      !si.linkId &&
      si.truckNames.length < 4 &&
      CreepTruck.getMovePartsAmount(si.truckNames) < si.maxTrackMoveParts
    );
  }
  private static getMovePartsAmount(trackNames: string[]): number {
    return trackNames.reduce(
      (acc, cur) => (Game.creeps[cur] ? acc + Game.creeps[cur].body.filter(bp => bp.type === CARRY).length : acc),
      0
    );
  }
}
