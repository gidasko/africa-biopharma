/* ==========================================================================
   AFRICA BIOPHARMA — counters.js
   Compteurs animés (chiffres clés) : montée de 0 à la valeur finale
   au moment où la section entre dans le viewport.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAnimatedCounters();
});

function initAnimatedCounters() {
  const group = document.querySelector('[data-counters-group]');
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach(setFinalValue);
    return;
  }

  const DURATION = 1600; // ms

  const runCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const suffix = el.dataset.suffix || '';
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current = Math.round(target * eased);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setFinalValue(el);
      }
    };

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          counters.forEach(runCounter);
          obs.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(group || counters[0]);
}

function setFinalValue(el) {
  const target = parseInt(el.dataset.target, 10) || 0;
  const suffix = el.dataset.suffix || '';
  el.textContent = target + suffix;
}
