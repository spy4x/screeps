export function getEnergyStorageAmount(room: Room): number {
  return (
    (room.storage?.store.energy || 0) +
    _.sum(
      (room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
      }) as StructureContainer[]).map(s => s.store.energy)
    )
  );
}
