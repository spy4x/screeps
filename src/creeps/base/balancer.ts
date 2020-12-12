import { BaseCreep, CreepSchema, findResourceToTransfer, GetBodyParts, moveTo, transfer } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepBalancer extends BaseCreep {
  public static role = WorkerRoles.balancer;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(): GetBodyParts {
    const base = [MOVE, CARRY, CARRY];
    const extra = base;
    return { base, extra, maxExtra: 15 };
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const MAX_CREEPS = 1;
    const creepsAmount = room
      .find(FIND_MY_CREEPS)
      .filter(c => c.memory.role === CreepBalancer.role && (!c.ticksToLive || c.ticksToLive > 100)).length;
    if (creepsAmount >= MAX_CREEPS) {
      return false;
    }

    const storageExists =
      !!room.storage ||
      !!room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }).length;
    if (!storageExists) {
      return false;
    }
    return {
      memory: {
        role: CreepBalancer.role,
        parentRoomName: room.name
      },
      bodyParts: this.getBodyParts()
    };
  }

  public run(): void {
    const somethingToFill = this.getSomethingToFill();

    if (!somethingToFill) {
      this.say('💤');
      this.dropToStorage();
      return;
    }

    if (this.creep.memory.working && this.creep.store.energy === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      this.say('💸️');

      if (this.creep.transfer(somethingToFill, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, somethingToFill);
      }
    } else {
      // find a silo to take from
      this.withdrawFromStorage();
    }
  }

  private withdrawFromStorage() {
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

  private getSomethingToFill(): null | Structure {
    return this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: structure => {
        if (
          structure.structureType !== STRUCTURE_TOWER &&
          structure.structureType !== STRUCTURE_SPAWN &&
          structure.structureType !== STRUCTURE_EXTENSION
        ) {
          return false;
        }
        const capacity = structure.store.getCapacity(RESOURCE_ENERGY);
        const usedCapacity = structure.store.getUsedCapacity(RESOURCE_ENERGY);
        const percentageFilled = usedCapacity / capacity;
        if (structure.structureType === STRUCTURE_TOWER) {
          return percentageFilled <= 0.8;
        } else if (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) {
          return percentageFilled < 1;
        } else {
          return false;
        }
      }
    });
  }

  private dropToStorage(): boolean {
    const storage = this.creep.room.storage;
    if (!storage) {
      return false;
    }
    const resourceType = findResourceToTransfer(this.creep);
    if (!resourceType) {
      return false;
    }
    return transfer(this.creep, storage, resourceType);
  }
}
