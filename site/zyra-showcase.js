/*
 * Zyra showcase — scroll-linked focus reveal.
 *
 * The artwork in .c-masonry.-light starts out of focus and sharpens as the
 * section scrolls into view. Progress is published as --zyra-p (0–1) and
 * data-zyra-pct (0–100) on the section. The original masonry markup is kept
 * in place (hidden by CSS), so the page's Vue hydration stays untouched.
 *
 * The section is re-acquired if the app ever re-renders it, and scroll events
 * are observed in the capture phase so any scroll container on the page works.
 */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

  let section = null;
  let meter = 0;
  let target = 0;
  let current = -1;
  let frame = 0;

  const acquire = () => {
    if (!section || !section.isConnected) {
      section = document.querySelector('.c-masonry.-light');
      meter = 0;
      current = -1;
    }
    return section;
  };

  const measure = () => {
    const el = acquire();
    if (!el) return;

    if (reduceMotion.matches) {
      target = 1;
      return;
    }

    if (!meter) meter = parseFloat(getComputedStyle(el).paddingTop) || 0;

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const artTop = rect.top + meter;
    const start = vh * 0.98;
    const end = vh * 0.16;

    target = clamp((start - artTop) / (start - end));
  };

  const render = () => {
    frame = 0;
    const el = acquire();
    if (!el) return;

    if (current < 0) current = target;
    else current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.0008) current = target;

    el.style.setProperty('--zyra-p', current.toFixed(4));
    el.setAttribute('data-zyra-pct', String(Math.round(current * 100)));

    if (current !== target) frame = requestAnimationFrame(render);
  };

  const update = () => {
    if (!acquire()) return;
    measure();
    if (!frame) frame = requestAnimationFrame(render);
  };

  document.addEventListener('scroll', update, { capture: true, passive: true });
  window.addEventListener('resize', update, { passive: true });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', update);
  }

  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      if (!section || !section.isConnected) update();
    }).observe(document.body, { childList: true, subtree: true });
  }

  update();
  current = target;
  render();
})();
