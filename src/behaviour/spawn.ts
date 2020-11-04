import { createName } from '../helpers/creep';
import { getCreepCreationResultDescription } from '../helpers/spawn';
import { isAnythingToBuild, isAnythingToRepair } from '../helpers/room';
import { WorkerRoles } from '../helpers/types';
import { assignFreeSourceToCreep } from '../helpers/source';

enum CREATE_CREEP_RESULT {
  OK = 1,
  NO_NEED = 0,
  CANNOT = -1
}

const createCreepIfNeeded = (spawn: StructureSpawn, role: WorkerRoles, amount: number): CREATE_CREEP_RESULT => {
  const creeps = Object.values(Game.creeps).filter(
    creep => creep.room.name === spawn.room.name && creep.memory.role === role
  );
  const creepsAmount = creeps.length;
  if (creepsAmount >= amount) {
    // console.log(`${role}: NO_NEED`);
    return CREATE_CREEP_RESULT.NO_NEED;
  }

  const creepName = createName(role);
  const energyAvailable = spawn.room.energyAvailable;
  const bodyParts = addExtraBodyParts([WORK, WORK, MOVE, CARRY], CARRY, energyAvailable);
  const cost = getCreepCost(bodyParts);
  let creepCreationResult = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
  if (creepCreationResult === OK) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // @ts-ignore
    creepCreationResult = spawn.spawnCreep(bodyParts, creepName, { memory: { role } });
    if (creepCreationResult === OK) {
      spawn.memory.spawning = { role, bodyParts, cost };
      return CREATE_CREEP_RESULT.OK;
    }
  }
  if (creepCreationResult === ERR_NOT_ENOUGH_ENERGY) {
    draw(spawn, `🕐 ${role} - ${energyAvailable}/${cost}`, 1, 1);
    draw(spawn, getBodyPartsDescription(bodyParts), 1, 2);
  } else {
    console.log(
      `CANNOT SPAWN`,
      JSON.stringify(
        {
          reason: getCreepCreationResultDescription(creepCreationResult),
          energy: `${energyAvailable}/${cost}`,
          creep: `${role} ${getBodyPartsDescription(bodyParts)}`
        },
        null,
        2
      )
    );
  }
  return CREATE_CREEP_RESULT.CANNOT;
};

export const behaviourSpawn = (spawn: StructureSpawn): void => {
  if (spawn.spawning) {
    const role = spawn.memory.spawning.role;
    const cost = spawn.memory.spawning.cost;
    const bodyParts = spawn.memory.spawning.bodyParts as BodyPartConstant[];
    draw(spawn, `✅ ${role} E:${cost}`, 1, 1);
    draw(spawn, getBodyPartsDescription(bodyParts), 1, 2);
  } else {
    // const creepsAmountInThisRoom = spawn.room.find(FIND_MY_CREEPS).length;
    // const sourcesSpotsInThisRoom = spawn.room.memory.sourcesInfo?.reduce((acc, cur) => acc + cur.maxWorkers, 0) || 1;
    // if (creepsAmountInThisRoom >= sourcesSpotsInThisRoom) {
    //   return;
    // }

    // TODO: population control sucks?
    // IDEA: How to control roles - check # of sources & figure out amount
    if (createCreepIfNeeded(spawn, WorkerRoles.harvester, 4) === CREATE_CREEP_RESULT.NO_NEED) {
      const isAnyThingToRepairInTheRoom = isAnythingToRepair(spawn.room);
      if (
        !isAnyThingToRepairInTheRoom ||
        (isAnyThingToRepairInTheRoom &&
          createCreepIfNeeded(spawn, WorkerRoles.repairer, 3) === CREATE_CREEP_RESULT.NO_NEED)
      ) {
        const isAnythingToBuildInTheRoom = isAnythingToBuild(spawn.room);
        if (
          !isAnythingToBuildInTheRoom ||
          (isAnythingToBuildInTheRoom &&
            createCreepIfNeeded(spawn, WorkerRoles.builder, 3) === CREATE_CREEP_RESULT.NO_NEED)
        ) {
          createCreepIfNeeded(spawn, WorkerRoles.upgrader, 20);
        }
      }
    }
  }
  const energyInfo = getEnergyInfo(spawn.room);
  draw(spawn, `${energyInfo.available}/${energyInfo.capacity}`, 1);
};

function getCreepCost(bodyParts: BodyPartConstant[]): number {
  return bodyParts.reduce((acc, cur) => acc + BODYPART_COST[cur], 0);
}

function addExtraBodyParts(
  bodyParts: BodyPartConstant[],
  extraPartType: BodyPartConstant,
  energyAvailable: number
): BodyPartConstant[] {
  const extraPartsAmount = Math.floor((energyAvailable - getCreepCost(bodyParts)) / BODYPART_COST[extraPartType]);
  if (extraPartsAmount < 1) {
    return bodyParts;
  }
  console.log(JSON.stringify({ extraPartsAmount }));
  const extraParts = new Array(extraPartsAmount).fill(extraPartType) as BodyPartConstant[];
  return [...bodyParts, ...extraParts];
}

function draw(spawn: StructureSpawn, text: string, xOffset = 0, yOffset = 0): void {
  const pos = new RoomPosition(spawn.pos.x + xOffset, spawn.pos.y + yOffset, spawn.room.name);
  spawn.room.visual.text(text, pos, {
    color: '#FFF',
    backgroundColor: '#000',
    opacity: 0.5,
    align: 'left'
  });
}

function getEnergyInfo(room: Room): { available: number; capacity: number } {
  return { available: room.energyAvailable, capacity: room.energyCapacityAvailable };
}

function getBodyPartsDescription(bodyParts: BodyPartConstant[]): string {
  const partsMap = bodyParts.reduce((acc, cur) => {
    const partLetter = cur[0];
    acc[partLetter] = acc[partLetter] ? acc[partLetter] + 1 : 1;
    return acc;
  }, {} as { [s: string]: number });
  const result = Object.keys(partsMap)
    .sort()
    .map(partLetter => `${partLetter}${partsMap[partLetter]}`)
    .join(' ');
  return `[${result}]`;
}
