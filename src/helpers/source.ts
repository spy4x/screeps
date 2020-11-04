export const assignFreeSourceToCreep = (creep: Creep): null | string => {
  if (!creep.room.memory.sourcesInfo) {
    creep.room.memory.sourcesInfo = creep.room.find(FIND_SOURCES).map(s => ({
      id: s.id,
      maxWorkers: 3,
      workerNames: []
    }));
  }
  const freeSources = creep.room.memory.sourcesInfo.filter(s => s.maxWorkers > s.workerNames.length);
  const closestFreeSource = creep.pos.findClosestByPath(FIND_SOURCES, {
    filter: s => freeSources.find(fs => fs.id === s.id)
  });
  if (!closestFreeSource) {
    return null;
  }
  const sourceInfo = creep.room.memory.sourcesInfo.find(s => s.id === closestFreeSource.id);
  if (!sourceInfo) {
    return null;
  }
  sourceInfo.workerNames.push(creep.name);
  return sourceInfo.id;
};

export const getAssignedSource = (creep: Creep): null | Source => {
  const sourceId = findAssignedSourceId(creep) || assignFreeSourceToCreep(creep);
  return sourceId ? Game.getObjectById(sourceId) : null;
};

export function findAssignedSourceId(creep: Creep): null | string {
  return creep.room.memory.sourcesInfo?.find(s => s.workerNames.includes(creep.name))?.id || null;
}

export function clearSourceIdForCreep(creep: Creep): void {
  const sourceInfo = creep.room.memory.sourcesInfo?.find(s => s.workerNames.includes(creep.name));
  if (!sourceInfo) {
    return;
  }
  sourceInfo.workerNames = sourceInfo.workerNames.filter(wn => wn !== creep.name);
}
