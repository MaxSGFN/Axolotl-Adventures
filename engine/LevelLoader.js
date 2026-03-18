import { EntityFactory } from "./EntityFactory.js";

export class LevelLoader {

  static async load(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }

  static buildLevel(data, world) {
    const results = {
      player: null,
      entities: []
    };

  
    const isOccupied = (x, y) => {
        if (results.player && results.player.x === x && results.player.y === y)
          return true;

        return results.entities.some(e => e.x === x && e.y === y);
    };


    // Player
    results.player = EntityFactory.create("player", data.player, world);

    // Fix placed entities
    for (const e of data.entities) {

      // RANGE wall?
      if (e.type === "wall" && e.from && e.to) {

        const [x1, y1] = e.from;
        const [x2, y2] = e.to;

        // horizontal oder vertical range
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);

        let x = x1;
        let y = y1;

        while (true) {

          if (!isOccupied(x, y)) {
            const ent = EntityFactory.create("wall", { x, y }, world);
            results.entities.push(ent);
          }

          if (x === x2 && y === y2) break;

          x += dx;
          y += dy;
        }

        continue;
      }

      // Normale Entity
      if (!isOccupied(e.x, e.y)) {
        const ent = EntityFactory.create(e.type, e, world);
        if (ent) results.entities.push(ent);
      }
    }

    // Random spawns
    if (data.random) {
      for (const type in data.random) {

        const cfg = data.random[type];

        let attempts = 0;
        let spawned = 0;

        while (spawned < cfg.count && attempts < 200) {
          attempts++;

          const [minX, minY, maxX, maxY] = cfg.inside;
          const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
          const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

          if (isOccupied(x, y)) continue;

          const ent = EntityFactory.create(type, { x, y }, world);
          results.entities.push(ent);

          spawned++;
        }
      }
    }


    return results;
  }
}