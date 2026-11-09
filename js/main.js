(() => {
  document.documentElement.classList.add('js');

  /* ---------- Header: solid background once you scroll past the top ---------- */
  const header = document.querySelector('[data-header]');
  const sentinel = document.querySelector('[data-header-sentinel]');
  if (header && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- Hero collage: draggable cards ---------- */
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;

  const cards = [...stage.querySelectorAll('[data-card]')];
  const collage = matchMedia('(min-width: 1024px)');
  const finePointer = matchMedia('(min-width: 1024px) and (pointer: fine)');
  const pos = new Map(cards.map((c) => [c, { x: 0, y: 0 }]));
  let topZ = 10;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const place = (card, x, y) => {
    const p = pos.get(card);
    p.x = x;
    p.y = y;
    card.style.translate = x || y ? `${x}px ${y}px` : '';
  };

  const raise = (card) => { card.style.zIndex = String(++topZ); };

  // How far a card may travel: it can hang off the stage edges a little, never vanish.
  const limits = (card) => {
    const r = card.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const p = pos.get(card);
    const left = r.left - p.x, right = r.right - p.x;
    const top = r.top - p.y, bottom = r.bottom - p.y;
    return {
      minX: s.left - left - r.width * 0.35,
      maxX: s.right - right + r.width * 0.35,
      minY: s.top - top - 40,
      maxY: s.bottom - bottom + r.height * 0.3,
    };
  };

  cards.forEach((card) => {
    // Pointer drag (mouse / trackpad)
    card.addEventListener('pointerdown', (e) => {
      if (!finePointer.matches || e.button !== 0 || e.target.closest('a, button')) return;
      e.preventDefault();

      const p = pos.get(card);
      const start = { cx: e.clientX, cy: e.clientY, px: p.x, py: p.y };
      const lim = limits(card);
      raise(card);
      card.classList.add('is-dragging');
      card.setPointerCapture(e.pointerId);

      const onMove = (ev) => {
        place(
          card,
          clamp(start.px + ev.clientX - start.cx, lim.minX, lim.maxX),
          clamp(start.py + ev.clientY - start.cy, lim.minY, lim.maxY)
        );
      };

      const end = () => {
        card.classList.remove('is-dragging');
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerup', end);
        card.removeEventListener('pointercancel', end);
      };
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', end);
      card.addEventListener('pointercancel', end);
    });

    // Keyboard alternative: focus the grip, then use arrow keys
    const grip = card.querySelector('[data-grip]');
    if (!grip) return;
    grip.addEventListener('click', () => raise(card));
    grip.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 64 : 16;
      const delta = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        ArrowUp: [0, -step], ArrowDown: [0, step],
      }[e.key];
      if (!delta) return;
      e.preventDefault();
      raise(card);
      const p = pos.get(card);
      const lim = limits(card);
      place(card, clamp(p.x + delta[0], lim.minX, lim.maxX), clamp(p.y + delta[1], lim.minY, lim.maxY));
    });
  });

  // One-click reset (also the single-pointer alternative to dragging)
  const reset = () => {
    stage.classList.add('is-settling');
    cards.forEach((c) => place(c, 0, 0));
    setTimeout(() => stage.classList.remove('is-settling'), 650);
  };
  document.querySelector('[data-tidy]')?.addEventListener('click', reset);

  // Leaving the collage layout (e.g. window resized narrow): drop any offsets
  collage.addEventListener('change', () => cards.forEach((c) => place(c, 0, 0)));
})();

/* ---------- Case study pages ---------- */
(() => {
  // Reading progress bar
  const bar = document.querySelector('[data-progress]');
  if (bar) {
    let queued = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      queued = false;
    };
    addEventListener('scroll', () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Highlight the section you're reading in the contents list
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) io.observe(section);
    });
  }

  // Gallery lightbox (native <dialog>: Esc closes, focus returns to the image you opened)
  const dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    const content = dialog.querySelector('[data-lightbox-content]');
    document.querySelectorAll('[data-lightbox]').forEach((btn) => {
      btn.addEventListener('click', () => {
        content.replaceChildren(...[...btn.children].map((n) => n.cloneNode(true)));
        const cap = btn.closest('li')?.querySelector('.gallery__cap');
        if (cap) {
          const p = document.createElement('p');
          p.className = 'lightbox__cap';
          p.textContent = cap.textContent;
          content.append(p);
        }
        dialog.showModal();
      });
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  }
})();

/* ---------- About: filter experience by type ---------- */
(() => {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const rows = [...document.querySelectorAll('.exp__item')];
  const status = document.querySelector('[data-filter-status]');
  if (!buttons.length || !rows.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      rows.forEach((row) => {
        const match = kind === 'all' || row.dataset.kind.split(' ').includes(kind);
        row.hidden = !match;
        if (match) shown += 1;
      });
      if (status) status.textContent = `Showing ${shown} of ${rows.length} roles`;
    });
  });
})();

/* ---------- Contact: copy email + current year ---------- */
(() => {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const btn = document.querySelector('[data-copy]');
  if (!btn) return;
  const status = document.querySelector('[data-copy-status]');
  const label = btn.textContent;
  let timer;

  const say = (msg) => { if (status) status.textContent = msg; };

  // If the clipboard is blocked, select the address so ⌘C / Ctrl+C works
  const selectAddress = () => {
    const el = document.querySelector('[data-copy-source]');
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  btn.addEventListener('click', async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied ✓';
      btn.classList.add('is-copied');
      say('Email address copied');
    } catch {
      selectAddress();
      btn.textContent = 'Press ⌘C / Ctrl+C';
      say('Email address selected. Press Command C or Control C to copy.');
    }
    timer = setTimeout(() => {
      btn.textContent = label;
      btn.classList.remove('is-copied');
    }, 2200);
  });
})();
