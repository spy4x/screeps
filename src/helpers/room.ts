import { getRepairFilter } from '../behaviour/repairer';

export function isAnythingToRepair(room: Room): boolean {
  return room.find(FIND_STRUCTURES, { filter: structure => getRepairFilter(structure, 75) }).length > 0;
}

export function isAnythingToBuild(room: Room): boolean {
  return room.find(FIND_MY_CONSTRUCTION_SITES).length > 0;
}
