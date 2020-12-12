import { BaseCreep, CreepSchema, harvest, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';
import { getRepairTarget } from '../../helpers/repair';
import { runFromHostileCreeps } from '../../helpers/runFromHostileCreeps';

export class CreepRemoteBuilder extends BaseCreep {
  public static role = WorkerRoles.remoteBuilder;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(spawnRoom: Room): false | CreepSchema {
    const targetRoomName = Object.keys(Memory.remoteHarvestingInRoom).find(roomName => {
      const rh = Memory.remoteHarvestingInRoom[roomName];
      return rh.isActive && !rh.builderName && rh.mainRoomName === spawnRoom.name;
    });
    if (!targetRoomName) {
      return false;
    }

    const baseBodyParts = [MOVE, CARRY, WORK];
    const bodyParts = { base: baseBodyParts, extra: baseBodyParts, maxExtra: 4 };

    return {
      memory: {
        role: CreepRemoteBuilder.role,
        parentRoomName: spawnRoom.name,
        targetRoomName
      },
      bodyParts
    };
  }

  public run(): void {
    if (runFromHostileCreeps(this)) {
      return;
    }

    const roomName = this.creep.memory.targetRoomName;
    if (!roomName) {
      return;
    }
    Memory.remoteHarvestingInRoom[roomName].builderName = this.creep.name;

    if (this.creep.room.name !== roomName) {
      moveTo(this.creep, new RoomPosition(20, 20, roomName));
      return;
    }

    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      this.work();
    } else {
      const droppedResource = this.creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
        filter: dr => dr.resourceType === RESOURCE_ENERGY && dr.amount > 300
      });
      if (droppedResource) {
        this.say('💎');
        // IMPORTANT: Track collects dropped energy from excavator. Used on low RCLs.
        if (this.creep.pickup(droppedResource) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, droppedResource);
        }
        return;
      }

      const container = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 300
      }) as StructureContainer;
      if (container) {
        if (this.creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(this.creep, container);
        }
        return;
      }

      const source = this.creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (!source) {
        this.say('⚠️ No source');
        return;
      }
      harvest(this.creep, source);
    }
  }

  private work() {
    this.build() || this.repair();
  }

  private repair(): boolean {
    const target =
      getRepairTarget(this.creep.pos, 25) ||
      getRepairTarget(this.creep.pos, 50) ||
      getRepairTarget(this.creep.pos, 75) ||
      getRepairTarget(this.creep.pos, 90);
    if (!target) {
      return false;
    }

    this.say('🔨️');
    const repairResult = this.creep.repair(target);
    if (repairResult === OK) {
      return true;
    }
    if (repairResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, target);
      return true;
    }
    console.log(`UNEXPECTED REPAIR RESULT: ${repairResult}`);
    return false;
  }

  private build(): boolean {
    const target = this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
    if (!target) {
      this.say('⚠️ Build');
      return false;
    }

    this.say('👷‍️');
    const buildResult = this.creep.build(target);
    if (buildResult === OK) {
      return true;
    }
    if (buildResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, target);
      return true;
    }
    console.log(`UNEXPECTED BUILD RESULT: ${buildResult}`);
    return true;
  }
}
