export function getRepairTarget(pos: RoomPosition, healthPercentage = 100): null | Structure {
  return pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => getRepairFilter(structure, healthPercentage)
  });
}

function getRepairFilter(structure: Structure, healthPercentage = 100): boolean {
  return typeFilter(structure) && healthFilter(structure, healthPercentage);
}

function typeFilter(structure: Structure): boolean {
  return (
    structure.structureType === STRUCTURE_ROAD ||
    structure.structureType === STRUCTURE_RAMPART ||
    structure.structureType === STRUCTURE_WALL ||
    structure.structureType === STRUCTURE_CONTAINER ||
    structure.structureType === STRUCTURE_SPAWN ||
    structure.structureType === STRUCTURE_TOWER ||
    structure.structureType === STRUCTURE_EXTENSION ||
    structure.structureType === STRUCTURE_LINK ||
    structure.structureType === STRUCTURE_STORAGE
  );
}

function healthFilter(structure: Structure, healthPercentage: number): boolean {
  const isHealthLowerThanPercentage =
    healthPercentage === 100
      ? structure.hits < structure.hitsMax
      : (structure.hits / structure.hitsMax) * 100 < healthPercentage;
  const isRampart = structure.structureType === STRUCTURE_RAMPART || structure.structureType === STRUCTURE_WALL;
  return isRampart ? structure.hits < 900 : isHealthLowerThanPercentage;
}

export function isAnythingToRepair(room: Room): boolean {
  return room.find(FIND_STRUCTURES, { filter: structure => getRepairFilter(structure, 75) }).length > 0;
}
