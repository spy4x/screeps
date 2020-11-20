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
    return { base, extra, maxExtra: 10 };
  }

  public static isNeedOfMore(room: Room): boolean {
    const creeps = room.find(FIND_MY_CREEPS).filter(c => c.memory.role === CreepBalancer.role);
    const notEnoughCreeps = creeps.length < 1;
    const storageExists = !!room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_STORAGE
    }).length;
    const result = (notEnoughCreeps || (creeps[0]?.ticksToLive ?? 0) < 100) && storageExists;
    if (result) {
      console.log(`Balancer needed:`, JSON.stringify({ noOtherBalancer: notEnoughCreeps, storageExists }));
    }
    return result;
  }

  public static getMemory(room: Room): CreepMemory {
    return {
      role: CreepBalancer.role,
      roomName: room.name
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

      const droppedResource = this.creep.pos.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
      if (droppedResource) {
        this.say('💎');
        // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
        if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, droppedResource);
        }
        return;
      }

      const tombstone = this.creep.pos.findInRange(FIND_TOMBSTONES, 40, {
        filter: t => t.store.getUsedCapacity() > 0
      })[0];
      if (tombstone) {
        this.say(`☠️`);
        const resourceType = Object.keys(tombstone.store).find(
          key => tombstone.store[key as ResourceConstant] > 0
        )! as ResourceConstant;
        if (this.creep.withdraw(tombstone, resourceType) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, tombstone);
        }
        return;
      }

      // const ruin = this.creep.pos.findInRange(FIND_RUINS, 5, { filter: t => t.store.energy })[0];
      // if (ruin) {
      //   this.say(`🏚️`);
      //   if (this.creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      //     moveTo(this.creep, ruin);
      //   }
      //   return;
      // }

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
        this.say('💤');
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
    return (
      this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure =>
          structure.structureType === STRUCTURE_TOWER &&
          (structure.store.energy * 100) / structure.store.getCapacity(RESOURCE_ENERGY) < 80
      }) ||
      this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure => {
          const isStore =
            structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION;
          return (
            isStore &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            (structure as any).store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      })
    );
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
