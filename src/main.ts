import { ErrorMapper } from 'utils/ErrorMapper';
import { WorkerRoles } from './helpers/types';
import { behaviourSpawn } from './behaviour/spawn';
import { roleBuilder } from './behaviour/builder';
import { roleHarvester } from './behaviour/harvester';
import { roleRepairer } from './behaviour/repairer';
import { roleUpgrader } from './behaviour/upgrader';
import { moveTo } from './helpers/creep';

console.log('------- COLD START --------');

// @ts-ignore
global.rsm = (): void => {
  console.log('---- RESETTING SOURCES INFO MEMORY ----');
  Object.values(Memory.rooms).forEach(room => room.sourcesInfo.forEach(s => (s.workerNames = [])));
};

interface SourceReport {
  rooms: { [room: string]: number };
  roles: { [role: string]: number };
}

// @ts-ignore
global.rw = (): void => {
  const report = Object.values(Game.creeps).reduce(
    (acc, creep) => {
      const room = creep.room.name;
      acc.rooms[room] = acc.rooms[room] ? acc.rooms[room] + 1 : 1;
      const role = creep.memory.role;
      acc.roles[role] = acc.roles[role] ? acc.roles[role] + 1 : 1;
      return acc;
    },
    { rooms: {}, roles: {} } as SourceReport
  );
  console.log(`Creeps:`, JSON.stringify(report, null, 2));
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  const start = Game.cpu.getUsed();
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
      Object.values(Memory.rooms).forEach(room =>
        room.sourcesInfo.forEach(s => {
          if (s.workerNames.includes(name)) {
            s.workerNames = s.workerNames.filter(wn => wn !== name);
          }
        })
      );
    }
  }
  // const spawn1 = getSpawn();
  // if (spawn1.memory.shouldResetMemory) {
  //   spawn1.memory.shouldResetMemory = false;
  //   resetSourcesInfoMemory();
  // }
  // if (spawn1.memory.shouldReportWorkers) {
  //   spawn1.memory.shouldReportWorkers = false;
  //   reportWorkers();
  // }
  // find creep in Workers or add it there
  Object.values(Game.spawns).forEach(behaviourSpawn);
  Object.values(Game.creeps).forEach(creep => {
    const isStoreFree = creep.store[RESOURCE_ENERGY] === 0;
    if (isStoreFree) {
      // Check dropped resources
      const droppedResourcesInRange = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 2);
      if (droppedResourcesInRange.length) {
        creep.say('💎!!');
        const droppedResourcesInRangeElement = droppedResourcesInRange[0];
        if (creep.pickup(droppedResourcesInRangeElement) === ERR_NOT_IN_RANGE) {
          if (moveTo(creep, droppedResourcesInRangeElement) === OK) {
            return;
          }
        }
      }

      // Check ruins & tombs
      const treasures =
        creep.pos.findInRange(FIND_RUINS, 2, { filter: ruin => ruin.store.energy }) ||
        creep.pos.findInRange(FIND_TOMBSTONES, 2, { filter: tomb => tomb.store.energy });
      if (treasures.length) {
        creep.say('💎!!');
        const treasure = treasures[0];
        if (creep.withdraw(treasure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          if (moveTo(creep, treasure) === OK) {
            return;
          }
        }
      }
    }
    runRole(creep);
  });
  const cpuUsed = Game.cpu.getUsed() - start;
  if (cpuUsed > 10) {
    console.log(`CPU used for loop: ${cpuUsed}`);
  }
});

function runRole(creep: Creep): void {
  const role = creep.memory.role as WorkerRoles;
  switch (role) {
    case WorkerRoles.harvester:
      return roleHarvester.run(creep);
    case WorkerRoles.upgrader:
      return roleUpgrader.run(creep);
    case WorkerRoles.builder:
      return roleBuilder.run(creep);
    case WorkerRoles.repairer:
      return roleRepairer.run(creep);
    default:
      return console.log(`UNRECOGNISED ROLE: ${role}. Creep: ${creep.name}`);
  }
}
