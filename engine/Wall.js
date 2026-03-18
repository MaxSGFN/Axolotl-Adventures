import { Entity } from "./Entity.js";

export class Wall extends Entity {
  constructor(x, y) {
    super(x, y, "wall");
    this.solid = true;
    this.tags.add("wall");
  }
}