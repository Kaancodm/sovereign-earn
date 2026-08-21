import { existsSync, readFileSync } from 'node:fs';

const required = [
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'public/index.html',
  'public/app.js',
  'public/manifest.webmanifest',
  'public/sw.js',
  'functions/package.json',
  'functions/index.js',
  'functions/coaching.js',
  'functions/lib/ledger.js',
  'workai/a2a_server.py',
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error(`Missing staging files: ${missing.join(', ')}`);
  process.exit(1);
}

const firebase = JSON.parse(readFileSync('firebase.json', 'utf8'));
if (firebase.functions?.runtime !== 'nodejs20') {
  throw new Error('Functions runtime must be nodejs20');
}
if (firebase.hosting?.public !== 'public') {
  throw new Error('Hosting public directory must be public');
}

const index = readFileSync('functions/index.js', 'utf8');
for (const name of [
  'createCoachingRequest',
  'acceptCoachingRequest',
  'completeCoachingRequest',
  'declineCoachingRequest',
  'cancelCoachingRequest',
]) {
  if (!index.includes(`exports.${name}`)) throw new Error(`Missing export: ${name}`);
}

console.log('staging-check: OK');
