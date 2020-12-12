import { DrawService } from '../helpers/draw.service';

export class Controller {
  private drawService = new DrawService(this.controller.room, this.controller.pos, 1, 0, {
    color: '#FFF',
    backgroundColor: '#000',
    opacity: 0.5,
    align: 'left'
  });
  public constructor(public controller: StructureController) {}

  public run(): void {
    this.drawService.draw(
      `📶 ${(this.controller.level + this.controller.progress / this.controller.progressTotal).toFixed(4)}`
    );
  }
}
