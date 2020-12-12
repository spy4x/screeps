import { LinkMemoryType } from '../helpers/types';

export class Link {
  public constructor(public link: StructureLink) {}

  public static find(
    type: LinkMemoryType,
    roomName: string,
    filter?: (link: StructureLink) => boolean
  ): null | StructureLink {
    if (!Memory.links) {
      Memory.links = {};
    }
    for (const id in Memory.links) {
      const lm = Memory.links[id];

      const fitsTypeAndRoom = lm.type === type && lm.roomName === roomName;
      if (!fitsTypeAndRoom) {
        continue;
      }

      const link = Game.getObjectById(id as Id<StructureLink>);

      if (!link) {
        delete Memory.links[id];
        continue;
      }

      if (!filter) {
        return link;
      }

      const filterResult = filter(link);
      if (filterResult) {
        return link;
      }
    }
    return null;
  }

  public run(): void {
    if (this.link.cooldown) {
      return;
    }
    const memory = this.getMemory();

    switch (memory.type) {
      case LinkMemoryType.source: {
        this.runSourceLink();
        return;
      }
      case LinkMemoryType.base: {
        this.runBaseLink();
        return;
      }
      case LinkMemoryType.target: {
        return;
      }
    }
  }

  private getMemory(): LinkMemory {
    if (!Memory.links) {
      Memory.links = {};
    }
    let memory = Memory.links[this.link.id];
    if (memory) {
      return memory;
    }

    // Need to define memory
    let type = LinkMemoryType.target;
    if (this.link.pos.findInRange(FIND_SOURCES, 2).length) {
      type = LinkMemoryType.source;
    } else if (this.link.room.storage && this.link.pos.getRangeTo(this.link.room.storage) <= 1) {
      type = LinkMemoryType.base;
    }

    memory = { type, roomName: this.link.room.name };
    Memory.links[this.link.id] = memory;
    return memory;
  }

  private transfer(otherLink: null | StructureLink): void {
    const logPrefix = `Link.transfer()`;
    if (!otherLink) {
      console.log(logPrefix, `Link ${Link.getDescription(this.link)} can't find link to transfer energy to.`);
      return;
    }

    const transferEnergyResult = this.link.transferEnergy(otherLink);
    if (transferEnergyResult !== OK) {
      console.log(
        logPrefix,
        `Link ${Link.getDescription(this.link)} failed to transfer energy to ${Link.getDescription(
          otherLink
        )} failed. ERR: ${transferEnergyResult}`
      );
    }
  }

  private runSourceLink() {
    this.updateSourceInfoIfNeeded();

    const freeSpace = this.link.store.getFreeCapacity(RESOURCE_ENERGY);
    if (freeSpace > 50) {
      return;
    }

    const energyAmount = this.link.store.energy;

    const filter = (link: StructureLink) => link.store.getFreeCapacity(RESOURCE_ENERGY) >= energyAmount;

    const roomName = this.link.room.name;
    const linkToTransfer =
      Link.find(LinkMemoryType.target, roomName, filter) || Link.find(LinkMemoryType.base, roomName, filter);

    this.transfer(linkToTransfer);
  }

  /**
   * Update SourceInfo to avoid spawning trucks for this source.
   * @private
   */
  private updateSourceInfoIfNeeded(): void {
    const source = this.link.pos.findInRange(FIND_SOURCES, 2)[0];
    const sourceInfo = Memory.sources[source.id];
    if (!sourceInfo) {
      return;
    }

    if (sourceInfo.linkId) {
      return;
    }

    sourceInfo.linkId = this.link.id;
  }

  private runBaseLink() {
    if (this.link.store.getFreeCapacity(RESOURCE_ENERGY) > 50) {
      return;
    }

    const roomName = this.link.room.name;
    if (Link.find(LinkMemoryType.source, roomName)) {
      return;
    }

    const targetLink = Link.find(LinkMemoryType.target, roomName, l => !l.store.energy);
    if (!targetLink) {
      return;
    }

    this.transfer(targetLink);
  }

  private static getDescription(link: StructureLink): string {
    const id = link.id;
    const linkMemory = Memory.links[id];
    if (!linkMemory) {
      return `[No link memory for ${id}]`;
    }
    return `[${linkMemory.roomName} ${linkMemory.type} ${id}]`;
  }
}
