export class DrawService {
  private drawAmount = 0;
  private static shouldDraw = Memory.shouldDraw;

  public constructor(
    private room: Room,
    private position: RoomPosition,
    private offsetX = 0,
    private offsetY = 0,
    private defaultStyle?: TextStyle
  ) {}

  public draw(text: string, style?: TextStyle): void {
    if (!DrawService.shouldDraw) {
      return;
    }
    const pos = new RoomPosition(
      this.position.x + this.offsetX,
      this.position.y + this.offsetY + this.drawAmount,
      this.room.name
    );
    this.room.visual.text(text, pos, style || this.defaultStyle);
    ++this.drawAmount;
  }
}
