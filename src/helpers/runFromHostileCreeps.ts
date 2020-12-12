/**
 * Checks if current room contains hostile creeps with attack parts and runs away to home room if
 * @param creep
 * @returns true if running away, otherwise false
 */
import { BaseCreep, moveTo } from './creep';

export function runFromHostileCreeps(baseCreep: BaseCreep): boolean {
  const creep = baseCreep.creep;
  if (creep.room.name !== creep.memory.targetRoomName) {
    // if creep is not at target room - don't need to check
    return false;
  }

  const amountOfHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
    filter: c => c.body.find(b => b.type === ATTACK || (b.type === RANGED_ATTACK && b.hits > 0))
  }).length;

  if (!amountOfHostileCreeps) {
    return false;
  }
  baseCreep.say('😱');
  moveTo(creep, new RoomPosition(25, 25, creep.memory.parentRoomName));
  return true;
}
