import { WorkerRoles } from '../helpers/types';

export function csm(): void {
  console.log('---- RESETTING SOURCES INFO MEMORY ----');
  Object.values(Memory.sources).forEach(s => {
    s.excavatorName = null;
    s.truckNames = [];
  });
  Object.values(Memory.creeps).forEach(c => {
    if ([WorkerRoles.truck, WorkerRoles.excavator].includes(c.role as WorkerRoles)) {
      c.sourceId = undefined;
    }
  });
}
