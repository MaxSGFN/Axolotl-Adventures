import { Entity } from "./Entity.js";

export class Axolotl extends Entity {
  constructor(world, x = 0, y = 0) {
    super(x, y, "Axo_south");  
    this.world = world;

    this.tags.add("player");
    this.solid = true;
    this.food = 0;

    this.direction = "south";

    this.spriteKeys = {
      north: "Axo_north",
      south: "Axo_south",
      east:  "Axo_east",
      west:  "Axo_west"
    };
  }

  move(dir) {
    this.direction = dir;

    let nx = this.x;
    let ny = this.y;

    if (dir === "east"  || dir === "osten")  nx++;
    if (dir === "west"  || dir === "westen") nx--;
    if (dir === "north" || dir === "norden") ny--;
    if (dir === "south" || dir === "sueden") ny++;

    Game.moveEntity(this, nx, ny);
  }

  eat() {
    let tx = this.x;
    let ty = this.y;

    if (this.direction === "east"  || this.direction === "osten")  tx++;
    if (this.direction === "west"  || this.direction === "westen") tx--;
    if (this.direction === "north" || this.direction === "norden") ty--;
    if (this.direction === "south" || this.direction === "sueden") ty++;

    let fish = Game.entities.find(
      e => e.tags.has("fish") && e.x === tx && e.y === ty
    );

    if (!fish) {
      fish = Game.entities.find(
        e => e.tags.has("fish") && e.x === this.x && e.y === this.y
      );
    }

    if (!fish) {
      Game.api.log("Kein Fisch zum Essen da!");
      return false;
    }

    Game.removeEntity(fish);

    this.food++;
    Game.api.log("Nom Nom, lecker! Fische gefressen: " + this.food);

    return true;
  }

  step() { this.move(this.direction); }

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

  getDirection() { return this.direction; }

  get_food() { return this.food; }

  position() { return { x: this.x, y: this.y }; }

  update(dt, engine) {
    super.update(dt, engine);

    const key = this.spriteKeys[this.direction];
    if (key) this.setSprite(key);
  }
}