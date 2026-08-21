#!/usr/bin/env node
/**
 * CI – Syntax-Check aller JavaScript-Dateien (Functions + Public)
 * Verhindert, dass kaputte Dateien deployed werden.
 *
 * Läuft als: npm test
 */
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGETS = ["functions", "public"];

let failed = 0;
let checked = 0;

function collect(dir) {
  const out = [];
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const name of fs.readdirSync(abs)) {
    const fp = path.join(abs, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      if (name === "node_modules") continue;
      out.push(...collect(path.join(dir, name)));
    } else if (name.endsWith(".js")) {
      out.push(fp);
    }
  }
  return out;
}

for (const target of TARGETS) {
  for (const file of collect(target)) {
    try {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
      console.log(`  ✔ ${path.relative(ROOT, file)}`);
    } catch (e) {
      failed++;
      console.error(`  ✘ ${path.relative(ROOT, file)}: Syntaxfehler`);
      console.error(String(e.stderr || e.message).split("\n").slice(0, 5).join("\n"));
    }
    checked++;
  }
}

console.log(`\nSyntax-Check: ${checked - failed}/${checked} Dateien OK`);
if (failed > 0) {
  process.exit(1);
}
