import { Wall } from "./Wall.js";
import { Fish } from "./Fish.js";
import { Axolotl } from "./Axolotl.js";

export class EntityFactory {

  static create(type, data, world) {
    switch(type) {

      case "wall":
        return new Wall(data.x, data.y);

      case "fish":
        return new Fish(data.x, data.y);

      case "player": 
        return new Axolotl(world, data.x, data.y);

      default:
        console.warn("Unknown entity type:", type);
        return null;
    }
  }
}