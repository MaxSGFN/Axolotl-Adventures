import { World } from "./World.js";
import { Axolotl } from "./Axolotl.js";
import { Renderer } from "./Renderer.js";
import { SPRITES } from "./assets.js";
import { CollisionSystem } from "./CollisionSystem.js";
import { Wall } from "./Wall.js";
import { Fish } from "./Fish.js";
import { LevelLoader } from "./LevelLoader.js";

export const GRID = 8;
export const TILE = 50;

export const Game = (() => {

  const world = new World(GRID, TILE);
  let renderer = null;
  let axolotl = null;
  let ready = false;
  let entities = [];

  const api = {
    log: (msg) => {
      // nur loggen, wenn die App eine Log-Funktion bereitstellt
      if (typeof globalThis.appendLog === "function") {
        globalThis.appendLog(msg);
      } else {
        // als Fallback in die Konsole
        console.log(msg);
      }
    },
    
    reset: () => {
      destroyAllSprites();

      entities = [];

      Game.loadLevel(Game.currentLevel);

      globalThis.ax = axolotl;
      render();
    }

  };

  function init(scene) {
    for (const [key, url] of Object.entries(SPRITES)) {
        scene.load.image(key, url);
    }

    scene.load.once("complete", () => {

        renderer = new Renderer(scene, world);

        // WICHTIG: Level-Load auf nächsten Frame verschieben
        scene.time.addEvent({
            delay: 0,
            callback: () => Game.loadLevel(Game.currentLevel)
        });

        globalThis.Game = Game;
    });

    scene.load.start();
  }

  async function loadLevel(url) {
      Game.currentLevel = url;

      if (renderer && renderer.g) {
          renderer.g.destroy();
      }
      renderer = null;

      //destroyAllSprites();
      entities = [];

      const data = await LevelLoader.load(url);

      world.size = data.size;

      const newWidth = world.size * TILE;
      const newHeight = world.size * TILE;
      phaserGame.scale.resize(newWidth, newHeight);

      // IMMER DIESE ZEILE benutzen
      const scene = phaserGame.scene.getScene("default");

      renderer = new Renderer(scene, world);

      const level = LevelLoader.buildLevel(data, world);

      axolotl = level.player;
      addEntity(axolotl);

      for (const e of level.entities) addEntity(e);

      globalThis.ax = axolotl;
      render();
  }

  function destroyAllSprites() {
    for (let e of entities) {
      if (e.sprite) {
        e.sprite.destroy();
        e.sprite = null;
      }
    }
  }

  function addEntity(e) {
    entities.push(e);

    // Sprite erzeugen, falls vorhanden
    if (renderer) {
      e.initSprite(renderer.scene, world);
    }
  }

  function removeEntity(e) {
    if (e.sprite) {
      e.sprite.destroy();
    }
    entities = entities.filter(en => en !== e);
  }

  function moveEntity(entity, nx, ny) {

    const oldX = entity.x;
    const oldY = entity.y;

    // Position testen
    entity.x = nx;
    entity.y = ny;

    const collisions = CollisionSystem.getCollisions(entity, entities);

    // Falls Kollision mit "solid"
    const blocked = collisions.find(c => c.solid);

    if (blocked) {
      // Position zurücksetzen
      entity.x = oldX;
      entity.y = oldY;

      api.log("Kollision: blockiert durch " + [...blocked.tags].join(","));
      return false;
    }

    // Placeholder für andere Events
    for (const c of collisions) {
      if (c.tags.has("goal")) {
        api.log("Goal reached!");
        // später: EventBus.trigger("goal:reached", entity, c)
      }
    }

    return true;
  }

  function reset() {
    api.reset();
  }
  

  function isTileFree(x, y) {
    return !entities.some(e => e.x === x && e.y === y);
  }


  function render() {
    

    api.log('render called');

    for (let e of entities) {
      if (e.spriteKey === "Axo_south" || e.spriteKey === "Axo_north" || e.spriteKey === "Axo_east" || e.spriteKey === "Axo_west") {
        api.log('render axolotl: ' + e.x + ',' + e.y + ' - ' + e.spriteKey);
      }
      e.syncSprite(world);
    }
    if (!renderer) return;
    renderer.drawAll(entities);
  }

  function step(dt) {
    if (!ready) return;

    for (let e of entities) {
      e.update(dt, Game);
    }

    render();
  }

  return {
    init,
    reset,
    step,
    render,
    api, 
    moveEntity,
    removeEntity,
    loadLevel,
    isTileFree,
    get world(){ return world; },
    get ax(){ return axolotl; },
    get entities(){ return entities; },
    get renderer(){ return renderer; }
  };

})();

globalThis.Game = Game;
Game.currentLevel = "levels/level2.json";