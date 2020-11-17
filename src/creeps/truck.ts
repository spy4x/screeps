import { BaseCreep, findSilo, GetBodyParts, moveTo } from '../helpers/creep';
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

  public static isNeedOfMore(): boolean {
    const sourcesLackingTrucks = Object.keys(Memory.sources).filter(sourceId =>
      CreepTruck.sourceFilter(Memory.sources[sourceId])
    );
    return !!sourcesLackingTrucks.length;
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepTruck.role,
      sourceId: null,
      working: false
    };
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
    return trackNames.reduce((acc, cur) => acc + Game.creeps[cur].body.filter(bp => bp.type === CARRY).length, 0);
  }

  public run(): void {
    if (this.creep.memory.working && this.creep.store.energy === 0) {
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
    const silo = findSilo(this.creep);
    if (silo) {
      this.say(`💸`);
      const transferResult = this.creep.transfer(silo, RESOURCE_ENERGY);
      if (transferResult === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, silo);
      } else if (transferResult === OK) {
        this.get$FromSource();
      }
    } else {
      this.say('⚠️');
      if (this.creep.store.getFreeCapacity() !== 0) {
        this.creep.memory.working = false; // get some more resources to keep them ready inside
      }
    }
  }

  private get$FromSource() {
    const sourceInfo = this.getSource();
    if (!sourceInfo) {
      this.say('⚠️');
      this.creep.memory.sourceId = null;
      return;
    }

    const roomPosition = new RoomPosition(sourceInfo.pos.x, sourceInfo.pos.y, sourceInfo.pos.roomName);
    const tombstone = roomPosition.findInRange(FIND_TOMBSTONES, 3, { filter: t => t.store.energy })[0];
    if (tombstone) {
      this.say(`☠️`);
      if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, tombstone);
      }
      return;
    }

    const droppedResource = roomPosition.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
    if (droppedResource) {
      this.say('💎');
      // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
      if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, droppedResource);
      }
      return;
    }

    const ruin = roomPosition.findInRange(FIND_RUINS, 3, { filter: t => t.store.energy })[0];
    if (ruin) {
      this.say(`🏚️`);
      if (this.creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, ruin);
      }
      return;
    }

    const container = roomPosition.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0] as StructureContainer;
    if (container?.store.energy) {
      this.say('🛒');
      if (this.creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, container);
      }
      return;
    }

    this.say('💤');
  }

  private getSource(): null | SourceInfo {
    if (this.creep.memory.sourceId) {
      return Memory.sources[this.creep.memory.sourceId];
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const sourceId = Object.keys(Memory.sources).find(sid => CreepTruck.sourceFilter(Memory.sources[sid]));
    if (sourceId) {
      this.creep.memory.sourceId = sourceId;
      Memory.sources[sourceId].truckNames.push(this.creep.name);
      return Memory.sources[sourceId];
    } else {
      console.log(`Truck ${this.creep.name} couldn't find source`);
      return null;
    }
  }
}
