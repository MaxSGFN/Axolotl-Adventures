//import { Game } from "./Game.js"; // Kommt später weg
export class Axolotl {
  #x = 0;
  #y = 0;

  constructor(world, x = 0, y = 0) {
    this.world = world;
    this.#x = x;
    this.#y = y;
    this.direction = "south";
  }

  // Getter blocken Setzen (Pyodide Kompatibilität)
  get x() { return this.#x; }
  set x(v) {}

  get y() { return this.#y; }
  set y(v) {}

  move(dir) {
    this.direction = dir;

    let nx = this.#x, ny = this.#y;

    if (dir === "east" || dir === "osten") nx++;
    if (dir === "west" || dir === "westen") nx--;
    if (dir === "north" || dir === "norden") ny--;
    if (dir === "south" || dir === "sueden") ny++;

    if (this.world.inBounds(nx, ny)) {
      this.#x = nx;
      this.#y = ny;
    }

    //Game.render(); // kommt später weg
  }

  step() {
    this.move(this.direction);
  }

  turn_left() {
    this.direction =
      this.direction === "north" ? "west" :
      this.direction === "west"  ? "south" :
      this.direction === "south" ? "east"  : "north";
  }

  turn_right() {
    this.direction =
      this.direction === "north" ? "east"  :
      this.direction === "east"  ? "south" :
      this.direction === "south" ? "west"  : "north";
  }

  getDirection() {
    return this.direction;
  }

  position() {
    return { x: this.#x, y: this.#y };
  }

  position_y() {
    return this.#y;
  }

  position_x() {
    return this.#x;
  }
}