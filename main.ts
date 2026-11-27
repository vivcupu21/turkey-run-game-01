// SPDX-License-Identifier: MIT
// Turkey Run — entry program for the make.fun bounty turkey-run-game-01.
//
// It hands the game in: it copies game/ and screenshots/ from this repository
// into the output directory (MAKEFUN_OUTPUT_DIR outside the grader, /output
// inside it) and writes /output/dossier.json with buildDossier from the kit's
// vendor/makefun-game.ts, byte for byte the dossier the gate rebuilds.
//
// Deterministic: files are copied in sorted path order, and the dossier is a
// pure function of the copied files, so two runs write identical bytes.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = resolve(import.meta.dirname);
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function assertPlainTree(dir: string, label: string): void {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const st = lstatSync(path);
    if (st.isSymbolicLink()) throw new Error(`${label}: symlink not allowed: ${path}`);
    if (st.isDirectory()) assertPlainTree(path, label);
    else if (!st.isFile()) throw new Error(`${label}: not a regular file: ${path}`);
  }
}

function main(): void {
  const gameDir = join(REPO_ROOT, 'game');
  const shotsDir = join(REPO_ROOT, 'screenshots');
  if (!statSync(gameDir).isDirectory()) throw new Error('game/ is missing');
  if (!statSync(shotsDir).isDirectory()) throw new Error('screenshots/ is missing');
  assertPlainTree(gameDir, 'game');
  assertPlainTree(shotsDir, 'screenshots');

  mkdirSync(OUTPUT_DIR, { recursive: true });
  cpSync(gameDir, join(OUTPUT_DIR, 'game'), { recursive: true });
  cpSync(shotsDir, join(OUTPUT_DIR, 'screenshots'), { recursive: true });

  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
  });
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`Turkey Run entry written to ${OUTPUT_DIR} (${dossier.length} byte dossier)`);
}

main();
