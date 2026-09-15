/* ==========================================================================
   AFRICA BIOPHARMA — main.js
   Logique front vanilla JS. Les modules spécifiques (panier, contact,
   admin...) seront ajoutés dans les sessions suivantes.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initRevealOnScroll();
});

/**
 * Révèle progressivement les éléments .reveal au scroll
 * via IntersectionObserver (plus performant qu'un scroll listener).
 */
function initRevealOnScroll() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-fade');
  if (!revealEls.length) return;

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
}
