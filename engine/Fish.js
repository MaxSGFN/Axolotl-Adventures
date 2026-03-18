import { Entity } from "./Entity.js";

export class Fish extends Entity {
  constructor(x, y) {
    super(x, y, "fish");    // fish spriteKey
    this.tags.add("fish");
    this.solid = false;    
  }
}
``