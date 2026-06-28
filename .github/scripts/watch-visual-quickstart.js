#!/usr/bin/env node
/**
 * Watch docs/content.yaml and rebuild the visual quickstart site on every save.
 *
 * Usage:
 *   npm run watch:visual-quickstart
 *
 * Leave this running while you edit content.yaml. Each time you save the file,
 * the visual quickstart HTML/CSS is regenerated automatically (same as `npm run build:visual-quickstart`).
 * Press Ctrl+C to stop.
 *
 * Zero dependencies: uses Node's built-in fs.watch. It watches the directory and
 * filters for content.yaml so it keeps working across atomic "save = replace file"
 * editors (where the file is briefly renamed/recreated).
 */

const { spawn } = require('child_process');
const { watch, existsSync } = require('fs');
const { join } = require('path');

const repoRoot = join(__dirname, '..', '..'); // .github/scripts -> repo root
const docsDir = join(repoRoot, 'docs');
const contentFile = join(docsDir, 'content.yaml');
const buildScript = join(__dirname, 'build-visual-quickstart.js');
const WATCHED = 'content.yaml';
const DEBOUNCE_MS = 200;

if (!existsSync(contentFile)) {
  console.error(`\u2716 Content file not found:\n  ${contentFile}`);
  process.exit(1);
}

let building = false;
let pending = false;
let timer = null;

function runBuild() {
  if (building) {
    pending = true; // a change arrived mid-build; rebuild once this one finishes
    return;
  }
  building = true;
  const child = spawn('node', [buildScript], { stdio: 'inherit' });
  child.on('exit', (code) => {
    building = false;
    if (code === 0) {
      console.log(`\u2713 Rebuilt at ${new Date().toLocaleTimeString()} \u2014 watching for changes\u2026`);
    } else {
      console.error(`\u2716 Build failed (exit ${code}) \u2014 fix the error and save again.`);
    }
    if (pending) {
      pending = false;
      runBuild();
    }
  });
}

function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(runBuild, DEBOUNCE_MS);
}

console.log(`Watching ${contentFile}\nPress Ctrl+C to stop.`);
runBuild(); // build once on startup so output is fresh

watch(docsDir, (_event, filename) => {
  if (filename === WATCHED) scheduleBuild();
});

process.on('SIGINT', () => {
  console.log('\nStopped watching.');
  process.exit(0);
});
