import { BaseCreep, CreepSchema, harvest, moveTo } from '../../helpers/creep';
import { WorkerRoles } from '../../helpers/types';

export class CreepRemoteExcavator extends BaseCreep {
  public static role = WorkerRoles.remoteExcavator;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static isNeedOfMore(room: Room): false | CreepSchema {
    const sourceId = Object.keys(Memory.sources).find(id => {
      const si = Memory.sources[id];
      // TODO: search of such sources not dynamically, but save it's status into memory to reduce CPU usage
      return si.isActive && !si.excavatorName && si.remoteHarvestingFromRoom === room.name;
    });

    if (!sourceId) {
      return false;
    }

    const baseBodyParts = [MOVE, WORK, WORK];
    return {
      memory: {
        role: CreepRemoteExcavator.role,
        parentRoomName: room.name,
        sourceId
      },
      bodyParts: {
        base: baseBodyParts,
        extra: baseBodyParts,
        maxExtra: 3
      }
    };
  }

  public run(): void {
    const source = this.getSource();
    if (!source) {
      const sourceInfo = Memory.sources[this.creep.memory.sourceId!];
      moveTo(this.creep, { pos: sourceInfo.pos });
      return;
    }
    harvest(this.creep, source);
  }

  private getSource(): null | Source {
    const id = this.creep.memory.sourceId! as Id<Source>;
    Memory.sources[id].excavatorName = this.creep.name;
    return Game.getObjectById(id);
  }
}
