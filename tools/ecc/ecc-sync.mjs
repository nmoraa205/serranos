#!/usr/bin/env node
// ecc-sync — instala un subconjunto curado y fijado (pinned) de ECC en .claude/ del proyecto.
// Herramienta de desarrollo: no la importa ningún código de producto y no tiene dependencias.
//
//   node tools/ecc/ecc-sync.mjs plan      --source <checkout de ECC>   (por defecto; no escribe nada)
//   node tools/ecc/ecc-sync.mjs apply     --source <checkout de ECC>
//   node tools/ecc/ecc-sync.mjs check                                  (detecta deriva frente al lock)
//   node tools/ecc/ecc-sync.mjs uninstall                              (quita solo lo que instaló)
//
// Garantías: verifica el commit fijado, nunca sobrescribe archivos que no instaló,
// respalda antes de reemplazar y rechaza caracteres Unicode invisibles/bidi.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith('--') ? args[0] : 'plan';
const flag = name => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const project = path.resolve(flag('project') || process.cwd());
const eccDir = path.join(project, '.claude', 'ecc');
const manifestPath = path.join(eccDir, 'ecc-pack.json');
const lockPath = path.join(eccDir, 'ecc-pack.lock.json');

const sha = buf => createHash('sha256').update(buf).digest('hex');
const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback);
const die = msg => {
  console.error(`ecc-sync: ${msg}`);
  process.exit(1);
};
// Zero-width, bidi y "tag characters": vectores típicos de inyección oculta en prompts.
const HIDDEN = /[​-‏‪-‮⁠-⁤﻿]|\uDB40[\uDC00-\uDC7F]/;

if (!fs.existsSync(manifestPath)) die(`falta ${path.relative(project, manifestPath)}`);
const manifest = readJson(manifestPath);
const lock = readJson(lockPath, { files: {} });

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) die(`enlace simbólico no permitido en el origen: ${p}`);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function selection(source) {
  const out = [];
  for (const a of manifest.agents || []) out.push([`agents/${a}.md`, `agents/${a}.md`]);
  for (const c of manifest.commands || []) out.push([`commands/${c}.md`, `commands/${c}.md`]);
  for (const s of manifest.skills || []) {
    const root = path.join(source, 'skills', s);
    if (!fs.existsSync(root)) die(`skill inexistente en el origen: ${s}`);
    for (const f of walk(root)) {
      const rel = path.relative(source, f).split(path.sep).join('/');
      out.push([rel, rel]);
    }
  }
  out.push(['LICENSE', 'ecc/LICENSE-ECC']);
  return out;
}

function transform(rel, text) {
  // Los subagentes heredan el modelo de la sesión: ECC no puede escalar a un modelo más caro.
  if (rel.startsWith('agents/') && manifest.transforms?.agentModel) {
    const end = text.indexOf('\n---', 3);
    if (text.startsWith('---') && end !== -1) {
      const head = text.slice(0, end).replace(/^model:.*$/m, `model: ${manifest.transforms.agentModel}`);
      return head + text.slice(end);
    }
  }
  return text;
}

function verifySource(source) {
  if (!source) die('falta --source <checkout de ECC>');
  if (!fs.existsSync(path.join(source, '.git'))) die(`${source} no es un checkout git`);
  const head = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (head !== manifest.source.commit) {
    die(`el origen está en ${head}, pero el commit auditado es ${manifest.source.commit}. ` +
      'Audita el nuevo commit y actualiza ecc-pack.json antes de sincronizar.');
  }
  const dirty = execFileSync('git', ['-C', source, 'status', '--porcelain', '--', 'agents', 'skills', 'commands', 'LICENSE'], { encoding: 'utf8' });
  if (dirty.trim()) die('el checkout de origen tiene cambios locales en agents/skills/commands');
}

function planOps(source) {
  return selection(source).map(([src, dst]) => {
    const srcPath = path.join(source, src);
    if (!fs.existsSync(srcPath)) die(`no existe en el origen: ${src}`);
    const raw = fs.readFileSync(srcPath, 'utf8');
    if (HIDDEN.test(raw)) die(`caracteres Unicode ocultos en ${src}; no se instala`);
    const content = transform(src, raw);
    const dest = path.join(project, '.claude', dst);
    const owned = lock.files[dst];
    let action = 'create';
    if (fs.existsSync(dest)) {
      const current = sha(fs.readFileSync(dest));
      if (current === sha(content)) action = 'unchanged';
      else if (!owned) action = 'conflict'; // existe y no es nuestro: no se toca
      else if (owned.installed !== current) action = 'modified-locally';
      else action = 'update';
    }
    return { src, dst, dest, content, action, sourceSha: sha(raw) };
  });
}

if (mode === 'plan' || mode === 'apply') {
  const source = flag('source') && path.resolve(flag('source'));
  verifySource(source);
  const ops = planOps(source);
  const count = a => ops.filter(o => o.action === a).length;
  for (const o of ops) if (o.action !== 'unchanged') console.log(`${o.action.padEnd(16)} .claude/${o.dst}`);
  console.log(`\nECC ${manifest.source.version} @ ${manifest.source.commit.slice(0, 12)} — ${ops.length} archivos: ` +
    `${count('create')} nuevos, ${count('update')} a actualizar, ${count('unchanged')} sin cambios, ` +
    `${count('conflict')} en conflicto (se omiten), ${count('modified-locally')} modificados localmente (se omiten salvo --force)`);
  if (mode === 'plan') {
    console.log('Simulación: no se escribió nada. Usa "apply" para instalar.');
    process.exit(0);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const force = args.includes('--force');
  const stale = Object.keys(lock.files).filter(dst => !ops.some(o => o.dst === dst));
  for (const o of ops) {
    if (o.action === 'conflict' || (o.action === 'modified-locally' && !force)) continue;
    if (o.action !== 'unchanged') {
      if (fs.existsSync(o.dest)) {
        const bak = path.join(eccDir, 'backups', stamp, o.dst);
        fs.mkdirSync(path.dirname(bak), { recursive: true });
        fs.copyFileSync(o.dest, bak);
      }
      fs.mkdirSync(path.dirname(o.dest), { recursive: true });
      fs.writeFileSync(o.dest, o.content);
    }
    lock.files[o.dst] = { source: o.src, sourceSha256: o.sourceSha, installed: sha(o.content) };
  }
  for (const dst of stale) {
    // Quitado del manifiesto: se elimina solo si sigue intacto.
    const dest = path.join(project, '.claude', dst);
    if (fs.existsSync(dest) && sha(fs.readFileSync(dest)) === lock.files[dst].installed) fs.rmSync(dest);
    delete lock.files[dst];
  }
  lock.source = manifest.source;
  lock.files = Object.fromEntries(Object.entries(lock.files).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  console.log(`Instalado. Lock: ${path.relative(project, lockPath)}`);
  process.exit(count('conflict') ? 2 : 0);
}

if (mode === 'check') {
  let bad = 0;
  for (const [dst, meta] of Object.entries(lock.files)) {
    const dest = path.join(project, '.claude', dst);
    const state = !fs.existsSync(dest) ? 'missing' : sha(fs.readFileSync(dest)) === meta.installed ? null : 'drifted';
    if (state) {
      bad++;
      console.log(`${state.padEnd(8)} .claude/${dst}`);
    }
  }
  const n = Object.keys(lock.files).length;
  console.log(bad ? `${bad} de ${n} archivos con deriva` : `OK: ${n} archivos coinciden con el lock (ECC @ ${lock.source?.commit?.slice(0, 12)})`);
  process.exit(bad ? 1 : 0);
}

if (mode === 'uninstall') {
  let removed = 0;
  let kept = 0;
  for (const [dst, meta] of Object.entries(lock.files)) {
    const dest = path.join(project, '.claude', dst);
    if (!fs.existsSync(dest)) continue;
    if (sha(fs.readFileSync(dest)) === meta.installed) {
      fs.rmSync(dest);
      removed++;
      let dir = path.dirname(dest);
      while (dir.startsWith(path.join(project, '.claude') + path.sep) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
    } else {
      kept++;
      console.log(`se conserva (modificado localmente) .claude/${dst}`);
    }
  }
  if (fs.existsSync(lockPath)) fs.rmSync(lockPath);
  console.log(`Eliminados ${removed}; conservados ${kept}. El manifiesto y las reglas propias no se tocan.`);
  process.exit(0);
}

die(`modo desconocido: ${mode}`);
