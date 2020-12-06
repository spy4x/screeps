import { SourceType } from '../helpers/types';

interface RoomSourceInfo {
  [roomName: string]: {
    status: string;
    sources: {
      [sourceId: string]: {
        isActive: boolean;
        type: SourceType;
        remoteHarvestingFromRoom: null | string;
        hasExcavator: boolean;
        linkOrTrucksAmount: boolean | number;
      };
    };
    active: number;
    total: number;
  };
}
export function rsm(roomName?: string): void {
  const report = Object.keys(Memory.sources).reduce((acc, sourceId) => {
    const sourceInfo = Memory.sources[sourceId];
    if (roomName && roomName !== sourceInfo.pos.roomName) {
      return acc;
    }
    if (!acc[sourceInfo.pos.roomName]) {
      acc[sourceInfo.pos.roomName] = {
        status: '0/0',
        sources: {},
        active: 0,
        total: 0
      };
    }

    const roomInfo = acc[sourceInfo.pos.roomName];
    if (sourceInfo.isActive) {
      roomInfo.active++;
    }
    roomInfo.total++;
    roomInfo.sources[sourceId] = {
      isActive: sourceInfo.isActive,
      type: sourceInfo.type as SourceType,
      remoteHarvestingFromRoom: sourceInfo.remoteHarvestingFromRoom,
      hasExcavator: !!sourceInfo.excavatorName,
      linkOrTrucksAmount: !!sourceInfo.linkId || sourceInfo.truckNames.length
    };
    roomInfo.status = `${roomInfo.active}/${roomInfo.total}`;
    return acc;
  }, {} as RoomSourceInfo);
  Object.values(report).forEach(room => {
    delete room.active;
    delete room.total;
  });
  console.log(`Sources:`, JSON.stringify(report, null, 2));
}
