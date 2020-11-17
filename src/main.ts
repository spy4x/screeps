import * as commands from './commands';
import { Controller } from './structures/controller';
import { CreepBalancer } from './creeps/balancer';
import { CreepBuilder } from './creeps/builder';
import { CreepExcavator } from './creeps/excavator';
import { CreepTruck } from './creeps/truck';
import { CreepUpgrader } from './creeps/upgrader';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Link } from './structures/link';
import { SpawnController } from './structures/spawnController';
import { Tower } from './structures/tower';
import { WorkerRoles } from './helpers/types';
import { CreepScout } from './creeps/scout';

if (!Game.rooms.sim) {
  console.log('------- COLD START --------');
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
function runStructure(structure: Structure): void {
  switch (structure.structureType) {
    case STRUCTURE_CONTROLLER:
      return new Controller(structure as StructureController).run();
    case STRUCTURE_TOWER:
      return new Tower(structure as StructureTower).run();
    case STRUCTURE_LINK:
      return new Link(structure as StructureLink).run();
    case STRUCTURE_SPAWN:
      return new SpawnController(structure as StructureSpawn).run();
    default:
      return;
  }
}

// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  const start = Game.cpu.getUsed();

  createMemorySourcesIfNeeded();
  cleanUpMemory();

  Object.values(Game.structures).forEach(runStructure);
  Object.values(Game.creeps).forEach(runCreep);

  const cpuUsed = Game.cpu.getUsed() - start;
  if (cpuUsed > 10) {
    console.log(`CPU used for loop: ${cpuUsed}`);
  }
});

function cleanUpMemory(): void {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      const sourceId = Memory.creeps[name]?.sourceId;
      delete Memory.creeps[name];
      if (!sourceId) {
        continue;
      }

      const source = Memory.sources[sourceId];
      if (!source) {
        continue;
      }

      if (source.excavatorName === name) {
        source.excavatorName = null;
      }

      const indexOf = source.truckNames.indexOf(name);
      if (indexOf >= 0) {
        source.truckNames.splice(indexOf, 1);
      }
    }
  }
}

/**
 * Automatically delete memory of missing creeps
 */
function createMemorySourcesIfNeeded(): void {
  if (!Memory.sources) {
    Memory.sources = {};
  }
  Object.values(Game.rooms).forEach(room =>
    room.find(FIND_SOURCES).forEach(source => {
      if (Memory.sources[source.id]) {
        return;
      }
      console.log(`Saving new source to memory`, JSON.stringify(source, null, 2));

      const spawn = source.pos.findClosestByRange(FIND_MY_SPAWNS);
      const maxTrackMoveParts = spawn ? Math.ceil(spawn.pos.findPathTo(source).length / 4) || 1 : 20;

      Memory.sources[source.id] = {
        pos: source.pos,
        isActive: true,
        excavatorName: null,
        linkId: null,
        maxTrackMoveParts,
        truckNames: []
      };
    })
  );
}

function runCreep(creep: Creep): void {
  // TODO: check what commands to creep can be executed in parallel or multiple times per tick
  const role = creep.memory.role;
  switch (role) {
    case WorkerRoles.upgrader:
      return new CreepUpgrader(creep).run();
    case WorkerRoles.builder:
      return new CreepBuilder(creep).run();
    case WorkerRoles.excavator:
      return new CreepExcavator(creep).run();
    case WorkerRoles.truck:
      return new CreepTruck(creep).run();
    case WorkerRoles.balancer:
      return new CreepBalancer(creep).run();
    case WorkerRoles.scout:
      return new CreepScout(creep).run();
    default:
      return console.log(`UNRECOGNISED ROLE: ${role}. Creep: ${creep.name}`);
  }
}

Object.assign(global, { ...commands });

Object.defineProperty(Array.prototype, 'flat', {
  value: function (depth = 1) {
    return this.reduce(function (flat: any, toFlatten: any) {
      return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
    }, []);
  }
});
