import { BaseCreep, createName, CreepSchema, GetBodyParts, getRoleShortName } from '../helpers/creep';
import { CreepBalancer } from '../creeps/base/balancer';
import { CreepBuilder } from '../creeps/base/builder';
import { CreepExcavator } from '../creeps/base/excavator';
import { CreepTruck } from '../creeps/base/truck';
import { CreepUpgrader } from '../creeps/base/upgrader';
import { DrawService } from '../helpers/draw.service';
import { WorkerRoles } from '../helpers/types';
import { CreepClaimer } from '../creeps/remoteHarvesting/claimer';
import { CreepRemoteBuilder } from '../creeps/remoteHarvesting/remoteBuilder';
import { CreepRemoteExcavator } from '../creeps/remoteHarvesting/remoteExcavator';
import { CreepRemoteTruck } from '../creeps/remoteHarvesting/remoteTruck';
import { CreepMineralExcavator } from '../creeps/base/mineralExcavator';
import { CreepLinker } from '../creeps/base/linker';
import { CreepRemoteGuard } from '../creeps/remoteHarvesting/remoteGuard';
import { CreepAttacker } from '../creeps/attack/attacker';
import { getEnergyStorageAmount } from '../helpers/room';
import { CreepFlagBuilder } from '../creeps/flag/builder';

export class SpawnController {
  private drawService = new DrawService(this.spawn.room, this.spawn.pos, 1, 0, {
    color: '#FFF',
    backgroundColor: '#000',
    opacity: 0.8,
    align: 'left'
  });
  private energyStatus = `${getEnergyStatus(this.spawn.room.energyAvailable)} / ${getEnergyStatus(
    getEnergyStorageAmount(this.spawn.room)
  )}`;

  public constructor(public spawn: StructureSpawn) {}

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
      const spawnOrder: typeof BaseCreep[] = [
        // base
        CreepTruck,
        CreepExcavator,
        CreepLinker,
        CreepBalancer,
        CreepBuilder,
        CreepUpgrader,
        CreepMineralExcavator,

        // flag
        CreepFlagBuilder,

        // remoteHarvesting
        CreepRemoteGuard,
        CreepRemoteExcavator,
        CreepRemoteTruck,
        CreepRemoteBuilder,
        CreepClaimer,

        // attack
        // CreepTowerDrainer,
        CreepAttacker
        // CreepDummy,
        // CreepScout
      ];
      for (const creepClass of spawnOrder) {
        const creepSchema = creepClass.isNeedOfMore(this.spawn.room);
        if (!creepSchema) {
          continue;
        }
        this.create(creepSchema);
        break;
      }
    }
  }

  /**
   * Tries to create a creep by provided schema.
   * @param creepSchema
   * @private
   * @returns true in case of success, false in case of failure
   */
  private create(creepSchema: CreepSchema): boolean {
    const role = creepSchema.memory.role as WorkerRoles;
    const name = createName(role);
    const energyAvailable = this.spawn.room.energyAvailable; // TODO: replace with energyCapacity to produce better
    // quality creeps rather than quantity
    const bodyParts = this.addExtraBodyParts(creepSchema.bodyParts, energyAvailable);
    const cost = SpawnController.getCreepCost(bodyParts);
    // @ts-ignore
    const opts = { memory: creepSchema.memory };
    const spawnCreepResult = this.spawn.spawnCreep(bodyParts, name, opts);
    switch (spawnCreepResult) {
      case OK:
        this.spawn.memory.spawning = { role, bodyParts, cost };
        return true;
      case ERR_NOT_ENOUGH_ENERGY:
        this.drawService.draw(`🕐 ${role} - ${energyAvailable}/${cost}`);
        this.drawService.draw(SpawnController.getBodyPartsDescription(bodyParts));
        return false;
      default:
        console.log(
          `SpawnController.create()`,
          `Fail to create a creep.`,
          JSON.stringify({
            spawnCreepResult,
            name,
            bodyParts,
            opts
          })
        );
        return false;
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
    const extraParts: BodyPartConstant[] = prototypeBodyPartsInfo.extra.length
      ? new Array(extraPartsAmount).fill(prototypeBodyPartsInfo.extra).flat()
      : [];
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
