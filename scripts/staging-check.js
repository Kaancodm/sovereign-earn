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

// 5) Functions v2 manifest
const functionsPackage = path.join(ROOT, "functions", "package.json");
if (!fs.existsSync(functionsPackage)) {
  errors.push("functions/package.json fehlt");
} else {
  const pkg = JSON.parse(fs.readFileSync(functionsPackage, "utf8"));
  const node22 = pkg.engines && pkg.engines.node === "22";
  const functionsV2 = pkg.dependencies && /^\^?7\./.test(pkg.dependencies["firebase-functions"] || "");
  if (!node22) errors.push("functions/package.json: Node 22 ist nicht gesetzt");
  if (!functionsV2) errors.push("functions/package.json: firebase-functions v7 (v2) fehlt");
  if (node22 && functionsV2) console.log("  ✔ Functions: Node 22 + firebase-functions v7");
}

// 6) PR-Validierung darf prüfen, aber nie deployen
const validationWorkflow = path.join(ROOT, ".github/workflows/firebase-validate.yml");
if (!fs.existsSync(validationWorkflow)) {
  errors.push(".github/workflows/firebase-validate.yml fehlt");
} else {
  const yml = fs.readFileSync(validationWorkflow, "utf8");
  const isPrWorkflow = /pull_request/.test(yml);
  const runsStagingCheck = /npm run check:staging/.test(yml);
  const deploys = /firebase\s+deploy/.test(yml);
  if (!isPrWorkflow) errors.push("firebase-validate.yml: fehlt 'pull_request'-Trigger");
  if (!runsStagingCheck) errors.push("firebase-validate.yml: führt check:staging nicht aus");
  if (deploys) errors.push("firebase-validate.yml: PR-Workflow darf nicht deployen");
  if (isPrWorkflow && runsStagingCheck && !deploys) {
    console.log("  ✔ PR-Workflow: validiert Firebase-Konfiguration ohne Deployment");
  }
}

if (errors.length) {
  console.error("\n✘ Staging-Config-Fehler:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\n✔ Staging-Config OK");
