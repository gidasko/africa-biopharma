/* ==========================================================================
   AFRICA BIOPHARMA — product-slider.js
   Construit dynamiquement, pour chaque fiche produit, le slider d'images
   (à partir de PRODUCTS_DATA[id].images, 1 à 4 entrées) et le badge prix
   (à partir de PRODUCTS_DATA[id].price). Conçu pour être rebranché sans
   changement de structure sur une source de données réelle (Session 9).
   ========================================================================== */

// Initialisation différée jusqu'à ce que products-data.js ait fini de
// fusionner les données dynamiques (base de données) avec les valeurs par
// défaut — voir js/products-data.js. L'événement est garanti d'être
// déclenché même si l'API est indisponible (repli sur les valeurs par
// défaut), donc pas de flag DOMContentLoaded séparé nécessaire ici.
window.addEventListener('products-data-ready', () => {
  initProductPriceBadges();
  initProductSliders();
});

function initProductPriceBadges() {
  const badges = document.querySelectorAll('[data-product-price]');
  badges.forEach((badge) => {
    const id = badge.dataset.productPrice;
    const data = window.PRODUCTS_DATA?.[id];
    const price = data ? data.price : null;
    badge.textContent = window.formatProductPrice(price);
    badge.classList.toggle('price-badge--on-demand', price === null || price === undefined || price === '');
  });
}

function initProductSliders() {
  const sliders = document.querySelectorAll('[data-product-images]');
  sliders.forEach(buildSlider);
}

function buildSlider(root) {
  const id = root.dataset.productImages;
  const data = window.PRODUCTS_DATA?.[id];
  const images = (data && Array.isArray(data.images) && data.images.length)
    ? data.images.slice(0, 4)
    : ['/assets/images/products/placeholder.jpg'];

  root.innerHTML = '';
  root.classList.add('product-slider');

  const track = document.createElement('div');
  track.className = 'product-slider__track';

  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'product-slider__slide' + (i === 0 ? ' is-active' : '');
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${root.dataset.productName || 'Produit'} — photo ${i + 1}`;
    img.loading = 'lazy';
    slide.appendChild(img);
    track.appendChild(slide);
  });

  root.appendChild(track);

  // Un seul visuel : pas besoin de contrôles
  if (images.length < 2) return;

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'product-slider__dots';

  const slides = Array.from(track.children);
  let current = 0;
  let timer = null;
  const AUTOPLAY_DELAY = 4500;

  const dots = images.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'product-slider__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Photo ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'product-slider__arrow product-slider__arrow--prev';
  prevBtn.setAttribute('aria-label', 'Photo précédente');
  prevBtn.innerHTML = '‹';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'product-slider__arrow product-slider__arrow--next';
  nextBtn.setAttribute('aria-label', 'Photo suivante');
  nextBtn.innerHTML = '›';

  root.append(prevBtn, nextBtn, dotsWrap);

  function render() {
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    render();
    resetAutoplay();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    timer = window.setInterval(next, AUTOPLAY_DELAY);
  }
  function stopAutoplay() {
    if (timer) window.clearInterval(timer);
  }
  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);

  // Swipe mobile
  let touchStartX = 0;
  root.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });

  root.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    } else {
      startAutoplay();
    }
  }, { passive: true });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) startAutoplay();
}
