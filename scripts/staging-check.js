#!/usr/bin/env node
/**
 * CI – Deterministischer Staging-Config-Check
 * Prüft, dass die Deployment-Konfiguration sicher ist:
 *  - Kein Auto-Deploy bei push/PR (nur workflow_dispatch + staging env)
 *  - .firebaserc zeigt auf ein Projekt
 *  - firebase.json zeigt auf das public/-Verzeichnis
 *
 * Läuft als: npm run check:staging
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const errors = [];

// 1) .firebaserc
const firebaserc = path.join(ROOT, ".firebaserc");
if (!fs.existsSync(firebaserc)) {
  errors.push(".firebaserc fehlt");
} else {
  const rc = JSON.parse(fs.readFileSync(firebaserc, "utf8"));
  if (!rc.projects || !rc.projects.default) {
    errors.push(".firebaserc: kein Default-Projekt gesetzt");
  } else {
    console.log(`  ✔ Firebase-Projekt: ${rc.projects.default}`);
  }
}

// 2) firebase.json
const firebaseJson = path.join(ROOT, "firebase.json");
if (!fs.existsSync(firebaseJson)) {
  errors.push("firebase.json fehlt");
} else {
  const fj = JSON.parse(fs.readFileSync(firebaseJson, "utf8"));
  if (fj.hosting && fj.hosting.public === "public") {
    console.log("  ✔ Hosting: public/");
  } else {
    errors.push("firebase.json: hosting.public ist nicht 'public'");
  }
  if (fj.functions && fj.functions.runtime) {
    console.log(`  ✔ Functions-Runtime: ${fj.functions.runtime}`);
  } else {
    errors.push("firebase.json: functions.runtime fehlt");
  }
}

// 3) deploy.yml – darf NUR workflow_dispatch sein
const workflow = path.join(ROOT, ".github/workflows/deploy.yml");
if (!fs.existsSync(workflow)) {
  errors.push(".github/workflows/deploy.yml fehlt");
} else {
  const yml = fs.readFileSync(workflow, "utf8");
  const hasPush = /^\s{2}push\s*:/m.test(yml);
  const hasDispatch = /workflow_dispatch/.test(yml);
  const hasStagingEnv = /environment:\s*staging/.test(yml);

  if (hasPush) errors.push("deploy.yml: enthält 'push:'-Trigger – Auto-Deploy verboten (nur workflow_dispatch)");
  if (!hasDispatch) errors.push("deploy.yml: fehlt 'workflow_dispatch'");
  if (!hasStagingEnv) errors.push("deploy.yml: fehlt 'environment: staging'");
  if (!hasPush && hasDispatch && hasStagingEnv) {
    console.log("  ✔ Workflow: workflow_dispatch + staging environment (kein Auto-Deploy)");
  }
}

// 4) firestore.rules vorhanden
if (!fs.existsSync(path.join(ROOT, "firestore.rules"))) {
  errors.push("firestore.rules fehlt");
} else {
  console.log("  ✔ firestore.rules vorhanden");
}

if (errors.length) {
  console.error("\n✘ Staging-Config-Fehler:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\n✔ Staging-Config OK");
