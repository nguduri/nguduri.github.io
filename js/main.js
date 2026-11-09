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

/* ---------- Lightbox for any [data-zoom] button ---------- */
(() => {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const content = dialog.querySelector('[data-lightbox-content]');

  document.querySelectorAll('[data-zoom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      content.replaceChildren(...[...btn.children].map((n) => n.cloneNode(true)));
      const caption = btn.dataset.caption;
      if (caption) {
        const p = document.createElement('p');
        p.className = 'lightbox__cap';
        p.textContent = caption;
        content.append(p);
      }
      dialog.showModal();
    });
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
})();
