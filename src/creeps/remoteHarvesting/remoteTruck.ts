import { BaseCreep, CreepSchema, findSilo, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepRemoteTruck extends BaseCreep {
  public static role = WorkerRoles.remoteTruck;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const sourceId = Object.keys(Memory.sources).find(id => {
      const si = Memory.sources[id];
      // TODO: search of such sources not dynamically, but save it's status into memory to reduce CPU usage
      return (
        si.isActive &&
        !!si.excavatorName &&
        si.remoteHarvestingFromRoom === room.name &&
        si.truckNames.length < 4 &&
        CreepRemoteTruck.getMovePartsAmount(si.truckNames) < si.maxTrackCarryParts
      );
    });
    if (!sourceId) {
      return false;
    }

    const baseBodyParts = [MOVE, CARRY, CARRY];
    return {
      memory: {
        role: CreepRemoteTruck.role,
        parentRoomName: room.name,
        sourceId
      },
      bodyParts: { base: baseBodyParts, extra: baseBodyParts, maxExtra: 15 }
    };
  }

  private static getMovePartsAmount(trackNames: string[]): number {
    return trackNames.reduce(
      (acc, cur) => (Game.creeps[cur] ? acc + Game.creeps[cur].body.filter(bp => bp.type === CARRY).length : acc),
      0
    );
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
    const parentRoomName = this.creep.memory.parentRoomName;
    if (parentRoomName !== this.creep.room.name) {
      moveTo(this.creep, { pos: { x: 20, y: 20, roomName: parentRoomName } });
      return;
    }
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
          'CreepRemoteTruck.get$ToBase():',
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

    const droppedResource = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3)[0];
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
    const id = this.creep.memory.sourceId! as Id<Source>;
    if (!Memory.sources[id].truckNames.includes(this.creep.name)) {
      Memory.sources[id].truckNames.push(this.creep.name);
    }
    return Game.getObjectById(id);
  }
}
