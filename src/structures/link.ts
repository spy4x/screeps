export class Link {
  public constructor(public link: StructureLink) {}

  public run(): void {
    const sourcesNearby = this.link.pos.findInRange(FIND_SOURCES, 2);
    if (!sourcesNearby.length) {
      this.checkBaseLinkInMemory();
      return;
    }

    // this Link is source-linked
    this.updateSourceInfoIfNeeded(sourcesNearby[0]);

    if (this.link.store.getFreeCapacity(RESOURCE_ENERGY) > 50) {
      return;
    }

    const baseLink = this.getBaseLink();

    if (!baseLink) {
      console.log(`Link ${this.link.id} couldn't find base link.`);
      return;
    }

    if (baseLink.store.getFreeCapacity(RESOURCE_ENERGY) < this.link.store.energy) {
      console.log(`Link ${this.link.id}: Base link is not free.`);
      return;
    }

    const transferEnergyResult = this.link.transferEnergy(baseLink);
    if (transferEnergyResult === OK) {
      console.log(`Link ${this.link.id} transferred energy to base link ${baseLink.id} successfully.`);
    } else {
      console.log(`Link ${this.link.id} transfer energy to ${baseLink.id} failed. ERR: ${transferEnergyResult}`);
    }
  }

  /**
   * Update SourceInfo to avoid spawning trucks for this source.
   * @param source
   * @private
   */
  private updateSourceInfoIfNeeded(source: Source): void {
    const sourceInfo = Memory.sources[source.id];
    if (!sourceInfo) {
      return;
    }

    if (sourceInfo.linkId) {
      return;
    }

    sourceInfo.linkId = this.link.id;
  }

  private getBaseLink(): null | StructureLink {
    const roomInfo = Memory.rooms[this.link.room.name];
    if (!roomInfo.baseLinkId) {
      return null;
    }

    return Game.getObjectById(roomInfo.baseLinkId);
  }

  private checkBaseLinkInMemory(): void {
    if (!Memory.rooms) {
      Memory.rooms = {};
    }
    let roomInfo = Memory.rooms[this.link.room.name];
    if (!roomInfo) {
      roomInfo = Memory.rooms[this.link.room.name] = { baseLinkId: null };
    }
    if (roomInfo.baseLinkId) {
      return;
    }
    const isThisBaseLink = !!this.link.pos.findInRange(FIND_MY_STRUCTURES, 2, {
      filter: { structureType: STRUCTURE_STORAGE }
    }).length;

    if (isThisBaseLink) {
      roomInfo.baseLinkId = this.link.id;
    }
  }
}
