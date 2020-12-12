import {
  BaseCreep,
  CreepSchema,
  findResourceToTransfer,
  findSilo,
  ITruck,
  moveTo,
  preventTruckFromDyingFull,
  transfer
} from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepTruck extends BaseCreep implements ITruck {
  public static role = WorkerRoles.truck;
  public ttlToDie = 75;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const sourcesLackingTrucks = room.find(FIND_SOURCES, {
      filter: s => CreepTruck.sourceFilter(Memory.sources[s.id])
    });
    const extractorsLackingTrucks = room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_EXTRACTOR && CreepTruck.sourceFilter(Memory.sources[s.id])
    });
    const lackingTrucks = !!sourcesLackingTrucks.length || !!extractorsLackingTrucks.length;
    if (!lackingTrucks) {
      return false;
    }

    const bodyBase = [MOVE, CARRY, CARRY];
    const sourceOrExtractor = [...sourcesLackingTrucks, ...extractorsLackingTrucks][0];
    return {
      memory: {
        role: CreepTruck.role,
        parentRoomName: room.name,
        sourceId: sourceOrExtractor.id
      },
      bodyParts: { base: bodyBase, extra: bodyBase, maxExtra: 2 }
    };
  }

  private static sourceFilter(si: SourceInfo): boolean {
    return (
      si.isActive &&
      !!si.excavatorName &&
      !si.linkId &&
      si.truckNames.length < 5 &&
      CreepTruck.getMovePartsAmount(si.truckNames) < si.maxTrackCarryParts
    );
  }

  private static getMovePartsAmount(trackNames: string[]): number {
    return trackNames.reduce(
      (acc, cur) => (Game.creeps[cur] ? acc + Game.creeps[cur].body.filter(bp => bp.type === CARRY).length : acc),
      0
    );
  }

  public run(): void {
    if (preventTruckFromDyingFull(this)) {
      return;
    }

    if (this.creep.memory.working && this.creep.store.getUsedCapacity() === 0) {
      this.creep.memory.working = false;
      this.say('🔜');
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
      this.say('🔙');
    }
    if (this.creep.memory.working) {
      this.returnToBase();
    } else {
      this.get$FromSource();
    }
  }

  public returnToBase() {
    const resourceType = findResourceToTransfer(this.creep);
    if (!resourceType) {
      return;
    }
    const silo = findSilo(this.creep, resourceType);
    if (silo) {
      transfer(this.creep, silo, resourceType);
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
      console.log(`${this.creep.memory.role} ${this.creep.name} couldn't find source`);
      this.say('⚠️');
      return;
    }

    const droppedResource = source.pos.findInRange(FIND_DROPPED_RESOURCES, 2, { filter: dr => dr.amount > 50 })[0];
    if (droppedResource) {
      this.say('💎');
      // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
      if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, droppedResource);
      }
      return;
    }

    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0] as StructureContainer;
    if (!container || !container.store.getUsedCapacity()) {
      this.say('💤');
      return;
    }

    this.say('🛒');
    const resourceType = findResourceToTransfer(container);
    if (!resourceType) {
      return;
    }
    if (this.creep.withdraw(container, resourceType) === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, container);
    }
  }

  private getSource(): null | Source | StructureExtractor {
    const sourceId = this.creep.memory.sourceId;
    const name = this.creep.name;
    if (sourceId) {
      if (!Memory.sources[sourceId].truckNames.includes(name)) {
        Memory.sources[sourceId].truckNames.push(name);
      }
      return Game.getObjectById(sourceId);
    }
    return null;
  }
}
