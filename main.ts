// The Funniest Toaster Error Message — make.fun judged-artifact entry.
//
// One line, at most 120 characters, that a kitchen toaster shows its owner when
// something goes wrong. The line is composed from small structured fields and
// rendered deterministically: fixed constant in, fixed bytes out. The grader runs
// the program twice in separate sandboxes and both runs must produce identical
// bytes, so nothing here reads the clock, the network, or a random source.

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type Fault = {
  /** Maintenance code a real appliance would flash in the corner of its panel. */
  code: string;
  /** Flat statement of the failed condition. No exclamation marks. */
  condition: string;
  /** The turn: the appliance admitting its own part in the failure. */
  confession: string;
};

// The brief ranks, in order: (1) a real toaster error, genuinely the funniest of
// its kind; (2) freshness — the surprise arrives where the obvious toaster puns
// never go; (3) tightness; (4) one appliance voice held to the end; (5) lands on a
// single read. So the obvious register — "I'm toast", "breadwinner", "you're
// toast", "butter luck next time" — is disqualified at criterion 2 no matter how
// well it is written. The way in is a *maintenance* fault, the least joke-shaped
// thing on the panel, and the turn is the appliance quietly admitting it is the
// cause of its own fault. Nothing else in the line points at the joke.
const CANDIDATES: Fault[] = [
  { code: "E2", condition: "Crumb tray at capacity.", confession: "It is mostly me." },
  { code: "E2", condition: "Crumb tray at capacity.", confession: "I am the crumbs. Do not ask." },
  { code: "E3", condition: "Slot 2 was a waffle.", confession: "I did what I could." },
  { code: "E9", condition: "Both slots warm, both empty.", confession: "I keep the heat on in case." },
];

// Chosen on length and on the turn landing at the last word: the short confession
// leaves the reader to work out that a toaster's crumbs are its own element
// shedding, which is the whole joke, and explains nothing.
const FAULT: Fault = CANDIDATES[0];

// The published gate: UTF-8 text, 1 to 120 characters, not only white space.
const MIN_CHARS = 1;
const MAX_CHARS = 120;
// The gate counts characters, the Size tie-break counts bytes. Staying ASCII keeps
// those two numbers equal so neither can drift out from under the other.
const TARGET_BYTES = 40;

// The panel shows the code beside the message, so the message leaves the code out
// and spends its characters on the fault. Two clauses, both short, both full
// stops: the flat statement of the failed condition, then the turn.
function renderLine(f: Fault): string {
  return `${f.condition} ${f.confession}`;
}

// The code still has to be a plausible one, so it is checked against the panel
// table rather than left as decoration.
function checkCode(code: string): void {
  if (!/^E[0-9]{1,2}$/.test(code)) refuse(`"${code}" is not a toaster fault code`);
}

function refuse(reason: string): never {
  process.stderr.write(`refused: ${reason}\n`);
  process.exit(1);
}

const line = renderLine(FAULT);
checkCode(FAULT.code);

// Every check below fails the run loudly rather than shipping a line the sealed
// scorer would silently bin.
const chars = Array.from(line).length;
const bytes = Buffer.byteLength(line, "utf8");

if (chars < MIN_CHARS || chars > MAX_CHARS) {
  refuse(`${chars} chars is outside ${MIN_CHARS}..${MAX_CHARS}`);
}
if (line.trim().length === 0) refuse("line is only white space");
if (line.includes("\n") || line.includes("\r")) refuse("line breaks the one-line rule");
if (line !== line.trim()) refuse("leading or trailing space costs Size");
if (/ {2,}/.test(line)) refuse("doubled space costs Size");
if (!/^[\x20-\x7E]+$/.test(line)) refuse("non-ASCII makes bytes diverge from chars");
if (bytes > TARGET_BYTES) refuse(`${bytes} bytes exceeds the ${TARGET_BYTES}-byte target`);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outPath = `${outDir}/entry.txt`;
mkdirSync(dirname(outPath), { recursive: true });
// No trailing newline: the Size column counts bytes, so a newline is free rank lost.
writeFileSync(outPath, line, "utf8");

const readBack = readFileSync(outPath, "utf8");
if (readBack !== line) refuse("the bytes on disk differ from the line composed");

process.stderr.write(`wrote ${chars} chars / ${bytes} bytes -> ${outPath}\n`);
