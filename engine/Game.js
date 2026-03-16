import { World } from "./World.js";
import { Axolotl } from "./Axolotl.js";
import { Renderer } from "./Renderer.js";

export const GRID = 8;
export const TILE = 50;

export const Game = (() => {

  const world = new World(GRID, TILE);
  let renderer = null;
  let axolotl = null;
  let ready = false;

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
      axolotl = new Axolotl(world, 0, 0);
      globalThis.ax = axolotl;   // für Pyodide
      render();
    }
  };

  function init(scene) {
    renderer = new Renderer(scene, world);
    axolotl = new Axolotl(world, 0, 0);

    // Exporte für Pyodide & Debug
    globalThis.Game = Game;
    globalThis.ax   = axolotl;

    render();
    ready = true;
  }

  function reset() {
    api.reset();
  }

  function render() {
    if (!renderer || !axolotl) return;
    renderer.drawAll(axolotl);
  }

  function step(dt) {
    if (!ready) return; // Sicherheit, dass init() schon gelaufen ist
    //placeholder
    render();
  }

  return {
    init,
    reset,
    step,
    render,
    api, 
    get world(){ return world; },
    get ax(){ return axolotl; },
    get renderer(){ return renderer; }
  };

})();
