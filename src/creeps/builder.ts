import { GetBodyParts, BaseCreep, moveTo } from '../helpers/creep';
import { pickup } from '../helpers/creep+pickup';
import { WorkerRoles } from '../helpers/types';

export class CreepBuilder extends BaseCreep {
  public static role = WorkerRoles.builder;

  public constructor(creep: Creep) {
    super(creep);
  }

  public static getBodyParts(): GetBodyParts {
    const base = [MOVE, CARRY, WORK];
    const extra = base;
    return { base, extra, maxExtra: 5 };
  }

  public static isNeedOfMore(): boolean {
    // TODO: idea - build queue - use command to setup a construction spot that will add info about it to an array
    //  that array will be checked by builders as next goal to build
    const doesCreepExist = Object.values(Game.creeps).filter(c => c.memory.role === CreepBuilder.role).length >= 1;
    const doesSiteExist = !!Object.values(Game.rooms).find(room => !!room.find(FIND_MY_CONSTRUCTION_SITES).length);
    return !doesCreepExist && doesSiteExist;
  }

  public static getMemory(): CreepMemory {
    return {
      role: CreepBuilder.role,
      sourceId: null,
      working: false
    };
  }

  public run(): void {
    if (this.creep.memory.working && this.creep.store[RESOURCE_ENERGY] === 0) {
      this.creep.memory.working = false;
    }
    if (!this.creep.memory.working && this.creep.store.getFreeCapacity() === 0) {
      this.creep.memory.working = true;
    }

    if (this.creep.memory.working) {
      this.work();
    } else {
      pickup(this);
    }
  }

  private work() {
    // TODO: idea -  have room build plan. Items from plan are added to the queue. Each 1000 ticks plan is check for
    //  missing / destroyed buildings are refreshed
    const target =
      this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES) ||
      Object.values(Game.constructionSites)
        .filter(cs => cs.my)
        .sort((a, b) => (a.pos.y - b.pos.y > 0 ? 1 : -1))[0];
    if (!target) {
      this.say('⚠️ Build');
      return;
    }
    this.say('👷‍️');
    const buildResult = this.creep.build(target);
    if (buildResult === OK) {
      return;
    }
    if (buildResult === ERR_NOT_IN_RANGE) {
      moveTo(this.creep, target);
      return;
    }
    console.log(`UNEXCPECTED BUILD RESULT: ${buildResult}`);
  }
}
