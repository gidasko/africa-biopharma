/* ==========================================================================
   AFRICA BIOPHARMA — hero-carousel.js
   Carrousel panoramique de la bannière héro : autoplay, pause au survol,
   pagination (dots), flèches précédent/suivant.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
});

function initHeroCarousel() {
  const root = document.querySelector('[data-hero-carousel]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.hero__slide'));
  const paginationWrap = document.querySelector('[data-hero-pagination]');
  const prevBtn = document.querySelector('[data-hero-prev]');
  const nextBtn = document.querySelector('[data-hero-next]');
  if (!slides.length) return;

  const AUTOPLAY_DELAY = 6000;
  let current = slides.findIndex((s) => s.classList.contains('is-active'));
  if (current === -1) current = 0;
  let timer = null;
  let isPaused = false;

  // Génère les dots de pagination
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero__dot' + (i === current ? ' is-active' : '');
    dot.setAttribute('aria-label', `Aller à la diapositive ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    paginationWrap?.appendChild(dot);
    return dot;
  });

  function render() {
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    render();
    resetAutoplay();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAutoplay() {
    if (isPaused || slides.length < 2) return;
    timer = window.setInterval(next, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevBtn?.addEventListener('click', prev);
  nextBtn?.addEventListener('click', next);

  // Pause au survol / focus (accessibilité)
  const heroSection = root.closest('.hero');
  ['mouseenter', 'focusin'].forEach((evt) =>
    heroSection?.addEventListener(evt, () => {
      isPaused = true;
      stopAutoplay();
    })
  );
  ['mouseleave', 'focusout'].forEach((evt) =>
    heroSection?.addEventListener(evt, () => {
      isPaused = false;
      startAutoplay();
    })
  );

  // Respecte la préférence de mouvement réduit : pas d'autoplay
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  render();
  if (!prefersReducedMotion) {
    startAutoplay();
  }
}
