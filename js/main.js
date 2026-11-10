/* ---------- Footer: "last updated" from the file's own date ---------- */
(() => {
  const el = document.querySelector('[data-updated]');
  if (!el) return;
  const d = new Date(document.lastModified);
  if (!Number.isNaN(d.getTime())) {
    el.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
  }
})();

/* ---------- About: badge swings toward the pointer ---------- */
(() => {
  const badge = document.querySelector('[data-badge]');
  if (!badge || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover)').matches) return;
  const rest = '-2deg';
  badge.addEventListener('pointermove', (e) => {
    const r = badge.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
    badge.style.rotate = `${(x * 6).toFixed(2)}deg`;
  });
  badge.addEventListener('pointerleave', () => { badge.style.rotate = rest; });
})();

/* ---------- Custom cursor: a little blue sun that trails the pointer ---------- */
(() => {
  // only for real mice/trackpads; touch devices keep their normal behaviour
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const sun = document.createElement('div');
  sun.className = 'cursor';
  sun.setAttribute('aria-hidden', 'true');
  document.body.append(sun);
  document.documentElement.classList.add('has-cursor');

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let x = -100, y = -100, cx = x, cy = y;

  const draw = () => {
    cx += (x - cx) * 0.25;   // easing: lower = lazier trail
    cy += (y - cy) * 0.25;
    sun.style.transform = `translate(${cx}px, ${cy}px)`;
    if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) requestAnimationFrame(draw);
    else running = false;
  };
  let running = false;

  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    sun.classList.add('is-visible');
    if (still) { cx = x; cy = y; sun.style.transform = `translate(${x}px, ${y}px)`; return; }
    if (!running) { running = true; requestAnimationFrame(draw); }
  });
  document.addEventListener('pointerleave', () => sun.classList.remove('is-visible'));
  addEventListener('pointerdown', () => sun.classList.add('is-down'));
  addEventListener('pointerup', () => sun.classList.remove('is-down'));

  // grow over anything clickable
  document.addEventListener('pointerover', (e) => {
    sun.classList.toggle('is-hover', !!e.target.closest('a, button, [role="button"], label, summary'));
  });
})();

/* ---------- Image viewer: play page images + case-study [data-zoom] buttons ---------- */
(() => {
  const items = document.querySelectorAll('.masonry .exp');
  const zoomButtons = document.querySelectorAll('[data-zoom]');
  if (!items.length && !zoomButtons.length && !document.querySelector('[data-locked]')) return;

  const viewer = document.createElement('dialog');
  viewer.className = 'viewer';
  viewer.setAttribute('aria-label', 'Enlarged image');
  viewer.innerHTML = `
    <button class="viewer__close" type="button" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
    <div class="viewer__stage"></div>`;
  document.body.append(viewer);
  const stage = viewer.querySelector('.viewer__stage');

  const open = (fig) => {
    const media = fig.querySelector('img, .ph');
    if (!media) return;
    const copy = media.cloneNode(true);
    copy.removeAttribute('loading');
    stage.replaceChildren(copy);
    viewer.showModal();
    document.documentElement.classList.add('viewer-open');
    // the dialog sits in the browser's top layer, so bring the sun cursor in with it
    const sun = document.querySelector('.cursor');
    if (sun) viewer.append(sun);
  };
  const close = () => viewer.close();

  items.forEach((fig) => {
    const cap = fig.querySelector('figcaption')?.textContent.trim();
    fig.classList.add('is-zoomable');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `Enlarge${cap ? `: ${cap}` : ''}`);
    fig.addEventListener('click', () => open(fig));
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(fig); }
    });
  });

  // case-study images are already <button data-zoom>, so they just need the click
  // (delegated, so it also works for content revealed after unlocking a case study)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-zoom]');
    if (btn) open(btn);
  });

  viewer.querySelector('.viewer__close').addEventListener('click', close);
  // clicking anywhere outside the image closes it; Esc works natively
  viewer.addEventListener('click', (e) => { if (!e.target.closest('img, .ph, .viewer__close')) close(); });
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    const sun = viewer.querySelector('.cursor');
    if (sun) document.body.append(sun);
  });
})();

/* ---------- Password-protected case studies ----------
   The article content ships encrypted (see tools/protect.mjs).
   The password derives an AES key in the browser; nothing is sent anywhere. */
(() => {
  const box = document.querySelector('[data-locked]');
  if (!box) return;
  const form = box.querySelector('[data-lock-form]');
  const input = form.querySelector('input');
  const btn = form.querySelector('button');
  const msg = form.querySelector('.lock__msg');
  const data = JSON.parse(box.querySelector('[data-cipher]').textContent);
  const memo = `case-unlocked:${location.pathname}`;
  const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  const decrypt = async (pw) => {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: bytes(data.salt), iterations: data.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(data.iv) }, key, bytes(data.ct));
    return new TextDecoder().decode(plain);
  };

  const reveal = (html, moveFocus) => {
    box.innerHTML = html;
    box.removeAttribute('data-locked');
    if (moveFocus) {
      const h1 = box.querySelector('h1');
      if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
    }
  };

  if (!window.crypto?.subtle) {
    msg.textContent = 'This page needs a secure (https) connection to unlock.';
    btn.disabled = true;
    return;
  }

  // stay unlocked for the rest of this browser session
  let saved = null;
  try { saved = sessionStorage.getItem(memo); } catch {}
  if (saved) decrypt(saved).then((html) => reveal(html, false)).catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = input.value.trim();
    if (!pw) { msg.textContent = 'Enter the password to continue.'; input.focus(); return; }
    btn.disabled = true;
    btn.textContent = 'Unlocking…';
    try {
      const html = await decrypt(pw);
      try { sessionStorage.setItem(memo, pw); } catch {}
      reveal(html, true);
    } catch {
      btn.disabled = false;
      btn.textContent = 'Unlock';
      input.setAttribute('aria-invalid', 'true');
      msg.textContent = 'That’s not the password. Try again.';
      input.select();
      form.classList.remove('is-wrong'); void form.offsetWidth; form.classList.add('is-wrong');
    }
  });
  input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); msg.textContent = ''; });
})();
