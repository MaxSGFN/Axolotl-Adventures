export class World {
  constructor(size = 8, tile = 50) {
    this.size = size;
    this.tile = tile;

    this.walls = [];
    this.goal = null;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }
}