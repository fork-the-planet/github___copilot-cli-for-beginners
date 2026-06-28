#!/usr/bin/env node
/**
 * Build the docs visual quickstart site from its content file.
 *
 * Usage:
 *   npm run build:visual-quickstart
 *
 * Edit the words in docs/content.yaml, then run this to regenerate
 * the HTML/CSS into docs/. Do NOT hand-edit the generated *.html -
 * it is overwritten on every build.
 *
 * The rendering engine (SVG visual quickstart frames, speech bubbles, auto-placement, etc.)
 * lives in the reusable visual-quickstart-generator skill; this is a thin launcher that
 * points that engine at this repo's content file and output dir.
 *
 * Optional env overrides:
 *   VISUAL_QUICKSTART_SKILL_DIR  path to the visual-quickstart-generator skill folder
 */

const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');
const os = require('os');

const repoRoot = join(__dirname, '..', '..'); // .github/scripts -> repo root
const docsDir = join(repoRoot, 'docs');
const contentFile = join(docsDir, 'content.yaml');

const skillDir =
  process.env.VISUAL_QUICKSTART_SKILL_DIR ||
  join(os.homedir(), '.copilot', 'skills', 'visual-quickstart-generator');
const buildScript = join(skillDir, 'scripts', 'build_site.js');

if (!existsSync(buildScript)) {
  console.error(
    `\u2716 Visual quickstart engine not found at:\n  ${buildScript}\n` +
      'Set VISUAL_QUICKSTART_SKILL_DIR to the visual-quickstart-generator skill folder, or install the skill.',
  );
  process.exit(1);
}
if (!existsSync(contentFile)) {
  console.error(`\u2716 Content file not found:\n  ${contentFile}`);
  process.exit(1);
}

console.log(`Building visual quickstart from ${contentFile}`);
const result = spawnSync(process.execPath, [buildScript], {
  stdio: 'inherit',
  env: { ...process.env, VISUAL_QUICKSTART_DOCS: docsDir, VISUAL_QUICKSTART_CONTENT: contentFile },
});

if (result.error) {
  console.error(`\u2716 Failed to run the engine: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 0);
