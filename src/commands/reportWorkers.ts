interface SourceReport {
  rooms: { [room: string]: number };
  roles: { [role: string]: number };
}

export function rw(): void {
  const report = Object.values(Game.creeps).reduce(
    (acc, creep) => {
      const room = creep.room.name;
      acc.rooms[room] = acc.rooms[room] ? acc.rooms[room] + 1 : 1;
      const role = creep.memory.role;
      acc.roles[role] = acc.roles[role] ? acc.roles[role] + 1 : 1;
      return acc;
    },
    { rooms: {}, roles: {} } as SourceReport
  );
  console.log(`Creeps:`, JSON.stringify(report, null, 2));
}
