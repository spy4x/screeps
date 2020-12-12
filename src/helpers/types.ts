export enum WorkerRoles {
  builder = 'builder',
  upgrader = 'upgrader',
  excavator = 'excavator',
  truck = 'truck',
  balancer = 'balancer',
  claimer = 'claimer',
  towerDrainer = 'towerDrainer',
  attacker = 'attacker',
  dummy = 'dummy',
  remoteBuilder = 'remoteBuilder',
  remoteExcavator = 'remoteExcavator',
  remoteTruck = `remoteTruck`,
  scout = 'scout',
  mineralExcavator = 'mineralExcavator',
  linker = 'linker',
  remoteGuard = 'remoteGuard'
}

export enum LinkMemoryType {
  source = 'source',
  base = 'base',
  target = 'target'
}

export enum SourceType {
  energy = 'energy',
  mineral = 'mineral'
}
