import { GetBodyParts, BaseCreep, moveTo } from '../helpers/creep';
import { WorkerRoles } from '../helpers/types';

export class CreepBalancer extends BaseCreep {
  public static role = WorkerRoles.balancer;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(): GetBodyParts {
    const base = [MOVE, CARRY, CARRY];
    const extra = base;
    return { base, extra, maxExtra: 5 };
  }

  public static isNeedOfMore(room: Room): boolean {
    const noOtherBalancer = !Object.values(Game.creeps).filter(c => c.memory.role === CreepBalancer.role).length;
    const storageExists =
      !!room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_STORAGE
      }).length ||
      !!room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }).length;
    const result = noOtherBalancer && storageExists;
    if (result) {
      console.log(`Balancer needed:`, JSON.stringify({ noOtherBalancer, storageExists }));
    }
    return result;
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepBalancer.role,
      sourceId: null,
      working: false
    };
  }

  public run(): void {
    const somethingToFill = this.getSomethingToFill();

    if (this.creep.memory.working && this.creep.store.energy === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      if (!somethingToFill) {
        this.dropToStorage();
        this.say('💤');
        return;
      }

      this.say('💸️');

      if (this.creep.transfer(somethingToFill, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, somethingToFill);
      }
    } else {
      if (this.emptyLink()) {
        return;
      }
      // find a silo to take from

      const tombstone = this.creep.pos.findInRange(FIND_TOMBSTONES, 15, { filter: t => t.store.energy })[0];
      if (tombstone) {
        this.say(`☠️`);
        if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, tombstone);
        }
        return;
      }

      const droppedResource = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
      if (droppedResource) {
        this.say('💎');
        // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
        if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, droppedResource);
        }
        return;
      }

      const ruin = this.creep.pos.findInRange(FIND_RUINS, 10, { filter: t => t.store.energy })[0];
      if (ruin) {
        this.say(`🏚️`);
        if (this.creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, ruin);
        }
        return;
      }

      if (!somethingToFill) {
        this.say('💤');
        return;
      }

      const closestStore = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => {
          const isStore =
            structure.structureType === STRUCTURE_STORAGE || structure.structureType === STRUCTURE_CONTAINER;
          const isSourceContainer =
            structure.structureType === STRUCTURE_CONTAINER && structure.pos.findInRange(FIND_SOURCES, 1).length;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          return isStore && !isSourceContainer && (structure as any).store.energy > 0;
        }
      });

      if (!closestStore) {
        this.say('⚠️');
        return;
      }
      this.say('🛒');

      if (this.creep.withdraw(closestStore, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, closestStore);
      }
    }
  }

  private emptyLink(): boolean {
    const baseLinkId = this.creep.room.memory.baseLinkId;
    if (!baseLinkId) {
      return false;
    }
    const link = Game.getObjectById(baseLinkId);
    if (!link?.store.energy) {
      return false;
    }
    const withdrawResult = this.creep.withdraw(link, RESOURCE_ENERGY);
    if (withdrawResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, link);
    }
    return true;
  }

  private getSomethingToFill(): null | Structure {
    return this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        const isStore =
          structure.structureType === STRUCTURE_SPAWN ||
          structure.structureType === STRUCTURE_EXTENSION ||
          structure.structureType === STRUCTURE_TOWER;
        return (
          isStore &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          (structure as any).store.getFreeCapacity(RESOURCE_ENERGY) > 0
        );
      }
    });
  }

  private dropToStorage(): void {
    const storage = this.creep.room.storage;
    if (!storage) {
      return;
    }
    if (this.creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, storage);
    }
  }
}
