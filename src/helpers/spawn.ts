export const getSpawn = (): StructureSpawn => Object.values(Game.spawns)[0];
export const getCreepCreationResultDescription = (result: number): string => {
  switch (result) {
    case OK:
      return 'OK';
    case ERR_NOT_OWNER:
      return 'NOT_OWNER';
    case ERR_NAME_EXISTS:
      return 'NAME_TAKEN';
    case ERR_BUSY:
      return 'SPAWN_BUSY';
    case ERR_NOT_ENOUGH_ENERGY:
      return 'NOT_ENOUGH_ENERGY';
    case ERR_INVALID_ARGS:
      return 'INVALID_ARGS';
    case ERR_RCL_NOT_ENOUGH:
      return 'RCL_NOT_ENOUGH';
    default:
      return 'UNKNOWN_RESULT';
  }
};
