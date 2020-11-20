import { createName, GetBodyParts, getRoleShortName } from '../helpers/creep';
import { CreepBalancer } from '../creeps/balancer';
import { CreepBuilder } from '../creeps/builder';
import { CreepExcavator } from '../creeps/excavator';
import { CreepTruck } from '../creeps/truck';
import { CreepUpgrader } from '../creeps/upgrader';
import { DrawService } from '../helpers/draw.service';
import { WorkerRoles } from '../helpers/types';
import { CreepScout } from '../creeps/scout';
import { CreepTowerDrainer } from '../creeps/towerDrainer';
import { CreepAttacker } from '../creeps/attacker';
import { CreepDummy } from '../creeps/dummy';

export class SpawnController {
  private drawService = new DrawService(this.spawn.room, this.spawn.pos, 1, 0, {
    color: '#FFF',
    backgroundColor: '#000',
    opacity: 0.8,
    align: 'left'
  });
  private energyStatus = `${getEnergyStatus(this.spawn.room.energyAvailable)} / ${getEnergyStatus(
    this.spawn.room.storage?.store.energy || 0
  )}`;

  public constructor(public spawn: StructureSpawn) {}

  public run(): void {
    this.drawService.draw(
      `${this.spawn.room.energyAvailable === this.spawn.room.energyCapacityAvailable ? '✅' : '🔶'} ${
        this.energyStatus
      }`
    );

    this.renew();

    if (this.spawn.spawning) {
      const role = this.spawn.memory.spawning.role;
      const cost = this.spawn.memory.spawning.cost;
      const bodyParts = this.spawn.memory.spawning.bodyParts as BodyPartConstant[];
      this.drawService.draw(
        `${this.spawn.spawning.remainingTime}t ${getRoleShortName(
          role as WorkerRoles
        ).toUpperCase()} 💲${cost} 💪${SpawnController.getBodyPartsDescription(bodyParts)}`
      );
    } else {
      if (CreepTruck.isNeedOfMore(this.spawn.room)) {
        this.create(CreepTruck.role, CreepTruck.getBodyParts, CreepTruck.getMemory);
      } else if (CreepExcavator.isNeedOfMore(this.spawn.room)) {
        this.create(CreepExcavator.role, CreepExcavator.getBodyParts, CreepExcavator.getMemory);
      } else if (CreepBuilder.isNeedOfMore(this.spawn.room)) {
        this.create(CreepBuilder.role, CreepBuilder.getBodyParts, CreepBuilder.getMemory);
      } else if (CreepBalancer.isNeedOfMore(this.spawn.room)) {
        this.create(CreepBalancer.role, CreepBalancer.getBodyParts, CreepBalancer.getMemory);
      } else if (CreepUpgrader.isNeedOfMore(this.spawn.room)) {
        this.create(CreepUpgrader.role, CreepUpgrader.getBodyParts, CreepUpgrader.getMemory);
      } else if (CreepScout.isNeedOfMore()) {
        this.create(CreepScout.role, CreepScout.getBodyParts, CreepScout.getMemory);
      } else if (CreepTowerDrainer.isNeedOfMore(this.spawn.room)) {
        this.create(CreepTowerDrainer.role, CreepTowerDrainer.getBodyParts, CreepTowerDrainer.getMemory);
      } else if (CreepAttacker.isNeedOfMore(this.spawn.room)) {
        this.create(CreepAttacker.role, CreepAttacker.getBodyParts, CreepAttacker.getMemory);
      } else if (CreepDummy.isNeedOfMore(this.spawn.room)) {
        this.create(CreepDummy.role, CreepDummy.getBodyParts, CreepDummy.getMemory);
      } else {
        // nothing to create
      }
    }
  }

  private static getCreepCost(bodyParts: BodyPartConstant[]): number {
    return bodyParts.reduce((acc, cur) => acc + BODYPART_COST[cur], 0);
  }

  private static getBodyPartsDescription(bodyParts: BodyPartConstant[]): string {
    const partsMap = bodyParts.reduce((acc, cur) => {
      const partLetter = cur[0];
      acc[partLetter] = acc[partLetter] ? acc[partLetter] + 1 : 1;
      return acc;
    }, {} as { [s: string]: number });
    const result = Object.keys(partsMap)
      .sort()
      .map(partLetter => `${partLetter}${partsMap[partLetter]}`)
      .join('');
    return `${result}`;
  }

  private create(
    role: WorkerRoles,
    getBodyPartsFn: (room: Room) => GetBodyParts,
    getMemoryFn: (room: Room) => any
  ): void {
    const name = createName(role);
    const energyAvailable = this.spawn.room.energyAvailable; // TODO: replace with energyCapacity to produce better
    // quality creeps rather than quantity
    const bodyParts = this.addExtraBodyParts(getBodyPartsFn(this.spawn.room), energyAvailable);
    const cost = SpawnController.getCreepCost(bodyParts);
    // @ts-ignore
    const spawnCreepResult = this.spawn.spawnCreep(bodyParts, name, { memory: getMemoryFn(this.spawn.room) });
    switch (spawnCreepResult) {
      case OK:
        this.spawn.memory.spawning = { role, bodyParts, cost };
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        this.drawService.draw(`🕐 ${this.energyStatus}`);
        this.drawService.draw(`${role} - ${energyAvailable}/${cost}`);
        this.drawService.draw(SpawnController.getBodyPartsDescription(bodyParts));
        break;
    }
  }

  private addExtraBodyParts(prototypeBodyPartsInfo: GetBodyParts, energyAvailable: number): BodyPartConstant[] {
    const freeEnergyForExtraParts = energyAvailable - SpawnController.getCreepCost(prototypeBodyPartsInfo.base);
    const costOfExtraParts = SpawnController.getCreepCost(prototypeBodyPartsInfo.extra);
    let extraPartsAmount = Math.floor(freeEnergyForExtraParts / costOfExtraParts);
    if (extraPartsAmount < 1) {
      return prototypeBodyPartsInfo.base;
    }
    if (extraPartsAmount > prototypeBodyPartsInfo.maxExtra) {
      extraPartsAmount = prototypeBodyPartsInfo.maxExtra;
    }
    const extraParts = new Array(extraPartsAmount).fill(prototypeBodyPartsInfo.extra).flat() as BodyPartConstant[];
    return [...prototypeBodyPartsInfo.base, ...extraParts].slice(0, MAX_CREEP_SIZE).sort((a, b) => {
      if (a === TOUGH) {
        return -1;
      }
      if (a === MOVE) {
        return 1;
      }
      return 0;
    });
  }

  private renew() {
    // TODO: decide if creep should be renewed based on his body parts - are they actual?
    // const creepsToRecycle = this.spawn.pos.findInRange(FIND_MY_CREEPS, 1, {
    //   filter: s => s.ticksToLive && s.ticksToLive < 1120
    // });
    // creepsToRecycle.forEach(c => {
    //   const result = this.spawn.renewCreep(c);
    //   console.log('Spawn.renew()', JSON.stringify({ creep: c.name, result }));
    // });
  }
}

function getEnergyStatus(energy: number): string {
  return energy >= 1000 ? `${(energy / 1000).toFixed(1)}k` : `${energy}`;
}