export class Renderer {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.g = scene.add.graphics();
  }

  drawGrid() {
    const { g } = this;
    g.clear();

    g.fillStyle(0x222222, 1);
    g.fillRect(0, 0, this.world.size * this.world.tile, this.world.size * this.world.tile);

    g.lineStyle(1, 0xffffff, 1);
    for (let x = 0; x <= this.world.size; x++) {
      g.strokeLineShape(new Phaser.Geom.Line(
        x * this.world.tile, 0,
        x * this.world.tile, this.world.size * this.world.tile
      ));
    }
    for (let y = 0; y <= this.world.size; y++) {
      g.strokeLineShape(new Phaser.Geom.Line(
        0, y * this.world.tile,
        this.world.size * this.world.tile, y * this.world.tile
      ));
    }
  }

  drawAxolotl(ax) {
    const { tile } = this.world;
    this.g.fillStyle(0xff77aa, 1);
    this.g.fillRect(ax.x * tile + 8, ax.y * tile + 8, tile - 16, tile - 16);
  }

  drawAll(ax) {
    this.drawGrid();
    this.drawAxolotl(ax);
  }
}