import { BaseCreep, CreepSchema, findResourceToTransfer, GetBodyParts, moveTo, transfer } from '../../helpers/creep';
import { LinkMemoryType, WorkerRoles } from '../../helpers/types';
import { Link } from '../../structures/link';

export class CreepLinker extends BaseCreep {
  public static role = WorkerRoles.linker;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(): GetBodyParts {
    const base = [MOVE, CARRY];
    const extra = [CARRY];
    return { base, extra, maxExtra: 3 };
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const MAX_CREEPS = 1;
    const creepsAmount = room
      .find(FIND_MY_CREEPS)
      .filter(c => c.memory.role === CreepLinker.role && (!c.ticksToLive || c.ticksToLive > 30)).length;
    if (creepsAmount >= MAX_CREEPS) {
      return false;
    }

    const baseLinkId = Object.keys(Memory.links).find(id => {
      const linkMemory = Memory.links[id];
      return linkMemory.roomName === room.name && linkMemory.type === LinkMemoryType.base;
    });
    if (!baseLinkId) {
      return false;
    }

    return {
      memory: {
        role: CreepLinker.role,
        parentRoomName: room.name,
        sourceId: baseLinkId
      },
      bodyParts: this.getBodyParts()
    };
  }

  public run(): void {
    const baseLink = Game.getObjectById(this.creep.memory.sourceId as Id<StructureLink>);
    if (!baseLink) {
      console.log(`${this.creep.memory.role} ${this.creep.name} couldn't find base link.`);
      this.say('⚠️');
      return;
    }

    if (
      Link.find(
        LinkMemoryType.target,
        this.creep.room.name,
        l => l.store.energy < l.store.getCapacity(RESOURCE_ENERGY) - 60
      ) &&
      !Link.find(LinkMemoryType.source, this.creep.room.name)
    ) {
      // need to fill base link
      const baseLinkFreeCapacity = baseLink.store.getFreeCapacity(RESOURCE_ENERGY);
      if (!baseLinkFreeCapacity) {
        return;
      }

      if (this.creep.store.energy < baseLinkFreeCapacity && this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
        this.withdrawFromStorage();
        return;
      }
      transfer(this.creep, baseLink);
      return;
    } else {
      // need to empty base link
      if (!baseLink.store.energy) {
        return;
      }

      if (!this.creep.store.getFreeCapacity()) {
        this.dropToStorage();
        return;
      }

      const withdrawResult = this.creep.withdraw(baseLink, RESOURCE_ENERGY);
      if (withdrawResult === ERR_NOT_IN_RANGE) {
        moveTo(this.creep, baseLink);
      }
    }
  }

  private withdrawFromStorage() {
    const storage = this.creep.room.storage;

    if (!storage) {
      this.say('💤');
      return;
    }

    this.say('🛒');
    if (this.creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, storage);
    }
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
