import { getRepairTarget } from '../helpers/repair';
import { WorkerRoles } from '../helpers/types';

export class Tower {
  public constructor(public tower: StructureTower) {}

  public run(): void {
    const enemy = this.tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (enemy) {
      this.tower.attack(enemy);
      return;
    }

    const creepToHeal = this.tower.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: creep => creep.hits < creep.hitsMax && creep.memory.role !== WorkerRoles.towerDrainer
    });
    if (creepToHeal) {
      this.tower.heal(creepToHeal);
      return;
    }

    const structureToRepair = getRepairTarget(this.tower.pos, 25) || getRepairTarget(this.tower.pos, 90);
    if (structureToRepair) {
      this.tower.repair(structureToRepair);
      return;
    }
  }
}
