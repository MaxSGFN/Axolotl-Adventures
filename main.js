// ====== Core-Konstanten ======
const GRID = 8;
const TILE = 50;

// ====== Core-Modelle ======
class World {
  constructor(size = GRID, tile = TILE) {
    this.size = size;
    this.tile = tile;

    
    this.walls = [];
    this.goal = null;

  }
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }
}

class Axolotl {
  #x = 0;
  #y = 0;

  constructor(world, x = 0, y = 0) {
    this.world = world;
    this.#x = x;
    this.#y = y;
    this.direction = "south";
  }

  
  // Read-only Getter + "leere" Setter, damit Pyodide nicht abstürzt
  get x() { return this.#x; }
  set x(v) { /* absichtlich leer – blockt Setzen */ }

  get y() { return this.#y; }
  set y(v) { /* absichtlich leer – blockt Setzen */ }


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
    Game.render();
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
}

// ====== Rendering ======
class Renderer {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.g = scene.add.graphics();
  }

  drawGrid() {
    const { g } = this;
    g.clear();

    // Hintergrund
    g.fillStyle(0x222222, 1);
    g.fillRect(0, 0, this.world.size * this.world.tile, this.world.size * this.world.tile);

    // Grid-Linien
    g.lineStyle(1, 0xffffff, 1);
    for (let x = 0; x <= this.world.size; x++) {
      g.strokeLineShape(new Phaser.Geom.Line(
        x * this.world.tile, 0, x * this.world.tile, this.world.size * this.world.tile
      ));
    }
    for (let y = 0; y <= this.world.size; y++) {
      g.strokeLineShape(new Phaser.Geom.Line(
        0, y * this.world.tile, this.world.size * this.world.tile, y * this.world.tile
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

// ====== UI/Log ======
let logEl;
function appendLog(text) {
  if (!logEl) {
    logEl = document.getElementById("log");
    if (!logEl) { console.warn("logEl nicht gefunden!"); return; }
  }
  if (typeof text === "object") text = JSON.stringify(text, null, 2);
  logEl.textContent += text + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

// ====== Game-Fassade (Orchestrierung) ======
const Game = (() => {
  const world = new World();
  let renderer = null;
  let ax = null;

  function init(phaserScene) {
    renderer = new Renderer(phaserScene, world);
    ax = new Axolotl(world, 0, 0);
    // Export für Pyodide:
    globalThis.Game = Game;
    globalThis.ax   = ax;   // optionaler Direktzugriff
    render();
  }

  function reset() {
    ax = new Axolotl(world, 0, 0);
    globalThis.ax = ax; // für Pyodide aktualisieren
    render();
  }

  async function loadLevel(url) {
  const data = await fetch(url).then(r => r.json());

  // Axolotl neu erzeugen
  ax = new Axolotl(world, data.start.x, data.start.y);
  ax.direction = data.start.direction ?? "south";
  globalThis.ax = ax;

  // Leveldaten setzen
  world.walls = data.walls ?? [];
  world.goal = data.goal ?? null;

  render();
}

  function render() {
    if (!renderer || !ax) return;
    renderer.drawAll(ax);
  }

  const api = {
    log: (msg) => appendLog((msg)),
    reset
  };

  return {
    init, reset, loadLevel, render, api,
    get world(){ return world; },
    get ax(){ return ax; },
    get renderer(){ return renderer; }
  };
})();

// ====== Phaser-Setup ======
const config = {
  type: Phaser.AUTO,
  width: GRID * TILE,
  height: GRID * TILE,
  parent: "game",
  backgroundColor: "#20232a",
  scene: {
    preload(){  
      this.load.image("ax", "sprites/axolotl.png");
      this.load.image("wall", "sprites/wall.png");
      this.load.image("goal", "sprites/goal.png");
    },
    create(){ Game.init(this); },
    update(){}
  }
};
const game = new Phaser.Game(config);

// ====== Monaco + Pyodide ======
let busy = false;
let monacoEditor;
let pyodideReady = (async () => await loadPyodide())();

window.addEventListener("DOMContentLoaded", () => {
  // Monaco Editor starten
  require(["vs/editor/editor.main"], function () {
    monacoEditor = monaco.editor.create(document.getElementById("editor"), {
      value: `# Beispiele:
ax.move("east")
ax.turn_left()
ax.step()
log(ax.position())`,
      language: "python",
      theme: "vs-dark",
      automaticLayout: true,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true
    });

    // ---------- MONACO: Autocomplete & Snippets für Python ----------

    const directions = ["\"north\"", "\"south\"", "\"east\"", "\"west\"", "\"norden\"", "\"sueden\"", "\"osten\"", "\"westen\""];

    const axMethods = [
      {
        label: "ax.move",
        insertText: "ax.move(${1|" + directions.join(",") + "|})",
        documentation: "Bewegt das Axolotl ein Feld in die angegebene Richtung.",
      },
      {
        label: "ax.turn_left",
        insertText: "ax.turn_left()",
        documentation: "Dreht die Blickrichtung 90° nach links.",
      },
      {
        label: "ax.turn_right",
        insertText: "ax.turn_right()",
        documentation: "Dreht die Blickrichtung 90° nach rechts.",
      },
      {
        label: "ax.step",
        insertText: "ax.step()",
        documentation: "Bewegt das Axolotl 1 Feld in die aktuelle Blickrichtung.",
      },
      {
        label: "ax.position",
        insertText: "ax.position()",
        documentation: "Gibt ein Objekt {x,y} zurück (in Python: (p.x, p.y)).",
      },
      {
        label: "ax.getDirection",
        insertText: "ax.getDirection()",
        documentation: "Gibt die aktuelle Blickrichtung zurück.",
      }
    ];

    const sugarFuncs = [
      {
        label: "move",
        insertText: "move(${1|" + directions.join(",") + "|})",
        documentation: "Alias für ax.move()."
      },
      {
        label: "turn_left",
        insertText: "turn_left()",
        documentation: "Alias für ax.turn_left()."
      },
      {
        label: "turn_right",
        insertText: "turn_right()",
        documentation: "Alias für ax.turn_right()."
      },
      {
        label: "position",
        insertText: "position()",
        documentation: "Alias: gibt (x,y) als Tupel."
      },
      {
        label: "direction",
        insertText: "direction()",
        documentation: "Alias für ax.getDirection()."
      },

      // deutsche Aliasse
      {
        label: "bewegen",
        insertText: "bewegen(${1|" + directions.join(",") + "|})",
        documentation: "Deutsch: bewegen(richtung) = ax.move(richtung)."
      },
      {
        label: "links_drehen",
        insertText: "links_drehen()",
        documentation: "Deutsch: links_drehen() = ax.turn_left()."
      },
      {
        label: "rechts_drehen",
        insertText: "rechts_drehen()",
        documentation: "Deutsch: rechts_drehen() = ax.turn_right()."
      },
      {
        label: "richtung",
        insertText: "richtung()",
        documentation: "Deutsch: richtung() = ax.getDirection()."
      }
    ];

    const pythonSnippets = [
  {
    label: "for",
    insertText:
`for \${1:i} in range(\${2:3}):
    \${3:pass}`,
    documentation: "For-Schleife."
  },
  {
    label: "while",
    insertText:
`while \${1:condition}:
    \${2:pass}`,
    documentation: "While-Schleife."
  },
  {
    label: "if",
    insertText:
`if \${1:cond}:
    \${2:pass}
elif \${3:cond2}:
    \${4:pass}
else:
    \${5:pass}`,
    documentation: "If-Else Block."
  },
  { 
  label: "print",
  insertText: "print(${1:msg})",
  documentation: "Gibt eine Nachricht in der Konsole aus."
  }
];

    function toItems(list, kind = monaco.languages.CompletionItemKind.Function) {
      return list.map(item => ({
        label: item.label,
        kind,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        insertText: item.insertText,
        documentation: item.documentation
      }));
    }

    const COMPLETE = [
      ...toItems(axMethods),
      ...toItems(sugarFuncs),
      ...toItems(pythonSnippets, monaco.languages.CompletionItemKind.Snippet)
    ];

    monaco.languages.registerCompletionItemProvider("python", {
      triggerCharacters: [".", "("],

      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        );

        const line = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        }).trim();

        // -------- ax.-Kontext --------
        if (/^ax\.$/.test(line)) {
          return {
            suggestions: axMethods.map(item => ({
              label: item.label.replace("ax.", ""),
              kind: monaco.languages.CompletionItemKind.Method,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              insertText: item.insertText.replace("ax.", ""),
              documentation: item.documentation,
              range
            })),
            incomplete: true
          };
        }

        // -------- globaler Kontext --------
        return {
          suggestions: COMPLETE.map(item => ({
            ...item,
            range
          })),
          incomplete: true
        };
      }
    });

    monaco.languages.registerHoverProvider("python", {
      provideHover: (model, position) => {
        const w = model.getWordAtPosition(position);
        if (!w) return;

        const key = w.word;
        const hoverTexts = {
          "move": "move(direction)\nBewegt das Axolotl.",
          "turn_left": "turn_left()\nDreht Blickrichtung 90° links.",
          "turn_right": "turn_right()\nDreht Blickrichtung 90° rechts.",
          "direction": "direction()\nGibt Blickrichtung zurück.",
          "position": "position()\nGibt (x, y) zurück.",
          "bewegen": "bewegen(direction)\nDeutsch: bewegen = move.",
          "links_drehen": "links_drehen()\nDeutsch: links_drehen = turn_left.",
          "rechts_drehen": "rechts_drehen()\nDeutsch: rechts_drehen = turn_right."
        };

        if (hoverTexts[key]) {
          return {
            range: new monaco.Range(
              position.lineNumber,
              w.startColumn,
              position.lineNumber,
              w.endColumn
            ),
            contents: [{ value: "```python\n" + hoverTexts[key] + "\n```" }]
          };
        }
      }
    });

  });
  

  document.getElementById("run").addEventListener("click", () => {
    Game.api.reset();
    const code = monacoEditor.getValue();
    runPython(code);
  });
});

// ====== Python ausführen ======
async function runPython(code) {
  if (busy) return;
  busy = true;
  appendLog(">> Starte Python ...");
  const py = await pyodideReady;

  try {
    await py.runPythonAsync(`
from js import Game

# Komfort-Funktionen
ax  = Game.ax
log = Game.api.log

# (Optional) Aliasse für Einsteiger:
move       = ax.move
turn_left  = ax.turn_left
turn_right = ax.turn_right
step       = ax.step
position   = lambda: (ax.position().x, ax.position().y)
direction  = ax.getDirection
pos = lambda: (ax.position().x, ax.position().y)  # kurzer Alias
dir = ax.getDirection  # kurzer Alias

  # Überschreibe print für einfaches Logging

# Deutsche Aliasse
bewegen = ax.move
links_drehen = ax.turn_left
rechts_drehen = ax.turn_right
richtung = ax.getDirection

${code}
    `);
    appendLog("✓ Fertig");
  } catch (e) {
    appendLog("! Fehler: " + e);
  }
  busy = false;
}