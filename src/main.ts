import * as commands from './commands';
import { Controller } from './structures/controller';
import { CreepBalancer } from './creeps/base/balancer';
import { CreepBuilder } from './creeps/base/builder';
import { CreepExcavator } from './creeps/base/excavator';
import { CreepTruck } from './creeps/base/truck';
import { CreepUpgrader } from './creeps/base/upgrader';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Link } from './structures/link';
import { SpawnController } from './structures/spawnController';
import { Tower } from './structures/tower';
import { SourceType, WorkerRoles } from './helpers/types';
import { CreepClaimer } from './creeps/remoteHarvesting/claimer';
import { CreepTowerDrainer } from './creeps/attack/towerDrainer';
import { CreepAttacker } from './creeps/attack/attacker';
import { CreepDummy } from './creeps/attack/dummy';
import { CreepRemoteBuilder } from './creeps/remoteHarvesting/remoteBuilder';
import { CreepRemoteExcavator } from './creeps/remoteHarvesting/remoteExcavator';
import { CreepRemoteTruck } from './creeps/remoteHarvesting/remoteTruck';
import { CreepScout } from './creeps/attack/scout';
import { CreepMineralExcavator } from './creeps/base/mineralExcavator';
import { CreepLinker } from './creeps/base/linker';
import { CreepRemoteGuard } from './creeps/remoteHarvesting/remoteGuard';

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
  if (cpuUsed > 20) {
    console.log(`CPU: ${cpuUsed.toFixed(0)}`);
  }
});

function cleanUpMemory(): void {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      const creepMemory = Memory.creeps[name];
      delete Memory.creeps[name];
      switch (creepMemory.role) {
        case WorkerRoles.truck:
        case WorkerRoles.remoteTruck:
        case WorkerRoles.excavator:
        case WorkerRoles.remoteExcavator:
        case WorkerRoles.mineralExcavator:
          const sourceId = creepMemory.sourceId;
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
          continue;
        case WorkerRoles.remoteBuilder:
        case WorkerRoles.remoteGuard:
        case WorkerRoles.claimer:
          const targetRoomName = creepMemory.targetRoomName;
          if (!targetRoomName) {
            continue;
          }
          const remoteHarvestingRoomInfo = Memory.remoteHarvestingInRoom[targetRoomName];
          if (!remoteHarvestingRoomInfo) {
            continue;
          }
          if (remoteHarvestingRoomInfo.guardName === name) {
            remoteHarvestingRoomInfo.guardName = null;
          }
          if (remoteHarvestingRoomInfo.claimerName === name) {
            remoteHarvestingRoomInfo.claimerName = null;
          }
          if (remoteHarvestingRoomInfo.builderName === name) {
            remoteHarvestingRoomInfo.builderName = null;
          }
          continue;
      }
    }
  }
}

/**
 * Automatically create memory for sources
 */
function createMemorySourcesIfNeeded(): void {
  if (!Memory.sources) {
    Memory.sources = {};
  }
  const saveToMemory = (source: Source | Structure) => {
    if (Memory.sources[source.id]) {
      return;
    }
    console.log(`Saving new source to memory`, JSON.stringify(source, null, 2));

    const spawn = source.pos.findClosestByRange(FIND_MY_SPAWNS);
    const maxTrackCarryParts = spawn
      ? (source instanceof Source && Math.ceil(spawn.pos.findPathTo(source).length / 4)) || 1
      : 20;

    Memory.sources[source.id] = {
      isActive: true,
      type: source instanceof Source ? SourceType.energy : SourceType.mineral,
      remoteHarvestingFromRoom: null,
      pos: source.pos,
      excavatorName: null,
      linkId: null,
      maxTrackCarryParts,
      truckNames: []
    };
  };
  Object.values(Game.rooms).forEach(room => {
    room.find(FIND_SOURCES).forEach(saveToMemory);
    room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_EXTRACTOR }).forEach(saveToMemory);
  });
}

function runCreep(creep: Creep): void {
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
    case WorkerRoles.claimer:
      return new CreepClaimer(creep).run();
    case WorkerRoles.towerDrainer:
      return new CreepTowerDrainer(creep).run();
    case WorkerRoles.attacker:
      return new CreepAttacker(creep).run();
    case WorkerRoles.dummy:
      return new CreepDummy(creep).run();
    case WorkerRoles.remoteBuilder:
      return new CreepRemoteBuilder(creep).run();
    case WorkerRoles.remoteExcavator:
      return new CreepRemoteExcavator(creep).run();
    case WorkerRoles.remoteTruck:
      return new CreepRemoteTruck(creep).run();
    case WorkerRoles.scout:
      return new CreepScout(creep).run();
    case WorkerRoles.mineralExcavator:
      return new CreepMineralExcavator(creep).run();
    case WorkerRoles.linker:
      return new CreepLinker(creep).run();
    case WorkerRoles.remoteGuard:
      return new CreepRemoteGuard(creep).run();
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
