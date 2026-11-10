#!/usr/bin/env node
// Password-protect a case study by encrypting its <article class="case"> content.
//
//   node tools/protect.mjs unlock <password>   → writes work/project-one.private.html (readable, git-ignored)
//   node tools/protect.mjs lock <password>     → encrypts it back into work/project-one.html (published)
//
// Edit the .private.html file, then run `lock` before committing.
// The published page holds only AES-GCM ciphertext; the browser decrypts it
// with the password (PBKDF2-SHA256 → AES-256-GCM, see js/main.js).
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';

const PAGE = 'work/project-one.html';
const PRIVATE = 'work/project-one.private.html';
const ITERATIONS = 310000;
const [cmd, password] = process.argv.slice(2);
if (!['lock', 'unlock'].includes(cmd) || !password) {
  console.error('usage: node tools/protect.mjs lock|unlock <password>');
  process.exit(1);
}

const ARTICLE = /(<article class="case"[^>]*>)([\s\S]*)(<\/article>)/;
const b64 = (buf) => Buffer.from(buf).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

async function key(pw, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function lockScreen(title, payload) {
  return `
      <a class="back" href="../index.html"><span aria-hidden="true">←</span> All work</a>
      <div class="lock fade-in">
        <h1 class="lock__title">${title}</h1>
        <p class="lock__text">This case study is password protected. Check my resume or <a href="mailto:nithyaguduri@gmail.com">reach out</a> for access.</p>
        <form class="lock__form" data-lock-form novalidate>
          <label class="label" for="case-password">Password</label>
          <div class="lock__row">
            <input class="lock__input" id="case-password" name="password" type="password" autocomplete="current-password" required>
            <button class="lock__btn" type="submit">Unlock</button>
          </div>
          <p class="lock__msg" role="status" aria-live="polite"></p>
        </form>
      </div>
      <script type="application/json" data-cipher>${JSON.stringify(payload)}</script>
    `;
}

if (cmd === 'lock') {
  const src = await readFile(PRIVATE, 'utf8');
  const m = src.match(ARTICLE);
  if (!m) throw new Error(`no <article class="case"> in ${PRIVATE}`);
  const h1 = (m[2].match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, 'Case study'])[1].trim();
  const title = h1.split(' – ')[0];   // "Southwest Airlines – Line Check Solver" → "Southwest Airlines"
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(password, salt), new TextEncoder().encode(m[2]));
  const payload = { v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  const out = src.replace(ARTICLE, `<article class="case" data-locked>${lockScreen(title, payload)}</article>`);
  await writeFile(PAGE, out);
  console.log(`locked → ${PAGE} (${Math.round(ct.byteLength / 1024)} KB encrypted)`);
} else {
  const page = await readFile(PAGE, 'utf8');
  const m = page.match(ARTICLE);
  const json = m && m[2].match(/<script type="application\/json" data-cipher>([\s\S]*?)<\/script>/);
  if (!json) throw new Error(`${PAGE} is not locked`);
  const p = JSON.parse(json[1]);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p.iv) }, await key(password, unb64(p.salt)), unb64(p.ct));
  } catch { console.error('wrong password'); process.exit(1); }
  await writeFile(PRIVATE, page.replace(ARTICLE, `<article class="case">${new TextDecoder().decode(plain)}</article>`));
  console.log(`unlocked → ${PRIVATE}`);
}
