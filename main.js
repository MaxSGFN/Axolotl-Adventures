// =====================
//  IMPORTS (Engine)
// =====================
import { Game, GRID, TILE } from "./engine/Game.js";

// =========================
// LEVEL AUS URL LADEN
// =========================
const params = new URLSearchParams(window.location.search);
const requestedLevel = params.get("level");
if (requestedLevel) {
    Game.currentLevel = requestedLevel;
}

// =====================
//  UI / LOG
// =====================
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
globalThis.appendLog = appendLog; 

// =====================
//  Phaser Setup
// =====================
const config = {
    type: Phaser.AUTO,
    width: GRID * TILE,
    height: GRID * TILE,
    parent: "game",
    backgroundColor: "#20232a",
    scene: {
        key: "default",
        preload(){},
        create(){
            Game.init(this);     // Game Engine Start
        },
        update(time, delta){
            Game.step(delta/1000);
        }
    }
};

const game = new Phaser.Game(config);
globalThis.phaserGame = game

// =====================
//  Monaco + Pyodide
// =====================
let busy = false;
let monacoEditor;


let pyodideReady = null;

window.addEventListener("load", async () => {
    const py = await loadPyodide({
        stdin: () => null
    });
    // Interrupt-Buffer bereitstellen (1 Byte reicht)
    const interruptBuffer = new Uint8Array(1);
    py.setInterruptBuffer(interruptBuffer);

    // Global speichern, damit wir den Abbruch triggern können
    globalThis._pyInterrupt = interruptBuffer;
    pyodideReady = py;

});



window.addEventListener("DOMContentLoaded", () => {

    // --------------------------
    // MONACO EDITOR SETUP
    // --------------------------
    require(["vs/editor/editor.main"], function () {
        monacoEditor = monaco.editor.create(document.getElementById("editor"), {
            value: `# Beispiele:
ax.move("east")
ax.turn_right()
ax.step()
log(ax.position())`,
            language: "python",
            theme: "vs-dark",
            automaticLayout: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true
        });


        // ---------- Autocomplete Snippets ----------
        const directions = [
            "\"north\"", "\"south\"", "\"east\"", "\"west\"",
            "\"norden\"", "\"sueden\"", "\"osten\"", "\"westen\""
        ];

        const axMethods = [
            { label: "ax.move", insertText: "ax.move(${1|" + directions.join(",") + "|})", documentation: "Bewegt das Axolotl." },
            { label: "ax.turn_left", insertText: "ax.turn_left()", documentation: "Dreht 90° nach links." },
            { label: "ax.turn_right", insertText: "ax.turn_right()", documentation: "Dreht 90° nach rechts." },
            { label: "ax.step", insertText: "ax.step()", documentation: "1 Schritt in Blickrichtung." },
            { label: "ax.position", insertText: "ax.position()", documentation: "Gibt die Position zurück." },
            { label: "ax.position_x", insertText: "ax.position_x()", documentation: "Gibt die x-Position zurück." },
            { label: "ax.position_y", insertText: "ax.position_y()", documentation: "Gibt die y-Position zurück." },
            { label: "ax.getDirection", insertText: "ax.getDirection()", documentation: "Gibt die Blickrichtung zurück." },
            { label: "ax.eat", insertText: "ax.eat()", documentation: "Isst einen Fisch." }
        ];

        const sugarFuncs = [
            // englisch
            { label: "move", insertText: "move(${1|" + directions.join(",") + "|})", documentation: "Alias für ax.move()" },
            { label: "turn_left", insertText: "turn_left()", documentation: "Alias für ax.turn_left()" },
            { label: "turn_right", insertText: "turn_right()", documentation: "Alias für ax.turn_right()" },
            { label: "step", insertText: "step()", documentation: "Alias für ax.step()" },
            { label: "position", insertText: "position()", documentation: "Gibt (x,y) zurück." },
            { label: "position_x", insertText: "position_x()", documentation: "Gibt die x-Position zurück." },
            { label: "position_y", insertText: "position_y()", documentation: "Gibt die y-Position zurück." },
            { label: "direction", insertText: "direction()", documentation: "Gibt die Richtung zurück." },
            { label: "eat", insertText: "eat()", documentation: "Alias für ax.eat()" },

            // deutsch
            { label: "bewegen", insertText: "bewegen(${1|" + directions.join(",") + "|})", documentation: "Deutsch: bewegen = ax.move()" },
            { label: "links_drehen", insertText: "links_drehen()", documentation: "Deutsch: links_drehen = ax.turn_left()" },
            { label: "rechts_drehen", insertText: "rechts_drehen()", documentation: "Deutsch: rechts_drehen = ax.turn_right()" },
            { label: "richtung", insertText: "richtung()", documentation: "Deutsch: richtung = ax.getDirection()" },
            { label: "schritt", insertText: "schritt()", documentation: "Deutsch: schritt = ax.step()" },
            { label: "essen", insertText: "essen()", documentation: "Deutsch: essen = ax.eat()" }
        ];

        const pythonSnippets = [
            {
                label: "for",
                insertText: `for \${1:i} in range(\${2:3}):
    \${3:pass}`,
                documentation: "For-Schleife."
            },
            {
                label: "while",
                insertText: `while \${1:condition}:
    \${2:pass}`,
                documentation: "While-Schleife."
            },
            {
                label: "if",
                insertText: `if \${1:cond}:
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
                documentation: "Konsole-Ausgabe."
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
            ...toItems(pythonSnippets),
            ...toItems(sugarFuncs)
        ];

        // ---------- Completion Provider ----------
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

                return {
                    suggestions: COMPLETE.map(item => ({ ...item, range })),
                    incomplete: true
                };
            }
        });

        // ---------- Hover Provider ----------
        monaco.languages.registerHoverProvider("python", {
            provideHover: (model, position) => {
                const w = model.getWordAtPosition(position);
                if (!w) return;

                const texts = {
                    // englisch
                    "move": "move(direction)\nBewegt das Axolotl.",
                    "turn_left": "turn_left()\nDreht 90° nach links.",
                    "turn_right": "turn_right()\nDreht 90° nach rechts.",
                    "step": "step()\nGeht 1 Schritt.",
                    "position": "position()\nGibt (x,y) zurück.",
                    "position_x": "position_x()\nGibt die x-Position zurück.",
                    "position_y": "position_y()\nGibt die y-Position zurück.",
                    "direction": "direction()\nGibt Blickrichtung zurück.",
                    "eat": "eat()\nIsst einen Fisch.",

                    // deutsch
                    "bewegen": "bewegen(richtung)\nDeutsch: bewegen = ax.move()",
                    "links_drehen": "links_drehen()\nDeutsch: links_drehen = ax.turn_left()",
                    "rechts_drehen": "rechts_drehen()\nDeutsch: rechts_drehen = ax.turn_right()",
                    "richtung": "richtung()\nDeutsch: richtung = ax.getDirection()",
                    "schritt": "schritt()\nDeutsch: schritt = ax.step()",
                    "essen": "essen()\nDeutsch: Isst einen Fisch."
                };

                if (texts[w.word]) {
                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            w.startColumn,
                            position.lineNumber,
                            w.endColumn
                        ),
                        contents: [{ value: "```python\n" + texts[w.word] + "\n```" }]
                    };
                }
            }
        });
    });

    // Run Button
    document.getElementById("run").addEventListener("click", () => {
        const code = monacoEditor.getValue();
        runPython(code);
    });

    //reset Button
    document.getElementById("reset").addEventListener("click", () => {
    Game.api.reset();
});
});

// =====================
//  PYTHON AUSFÜHREN
// =====================
async function runPython(code) {
    if (busy) return;
    busy = true;

    appendLog(">> Starte Python ...");

    const py = await pyodideReady;

    try {
        await py.runPythonAsync(`
from js import Game, appendLog

ax  = Game.ax
ax.reset_position()

log = appendLog
print = appendLog

# englisch
move       = ax.move
turn_left  = ax.turn_left
turn_right = ax.turn_right
step       = ax.step
position   = lambda: (ax.position().x, ax.position().y)
position_x = lambda: ax.position().x
position_y = lambda: ax.position().y
direction  = ax.getDirection
eat        = ax.eat

# kurz
pos   = position
pos_x = position_x
pos_y = position_y
dir   = direction

# deutsch
bewegen       = ax.move
links_drehen  = ax.turn_left
rechts_drehen = ax.turn_right
richtung      = ax.getDirection
schritt       = ax.step
essen         = ax.eat
futter        = lambda: ax.get_food()

${code}
`);

        appendLog("✓ Fertig");
        Game.render();
    } catch (e) {
            appendLog("! Fehler: " + e);
        }

    busy = false;
}