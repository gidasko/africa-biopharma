/* ==========================================================================
   AFRICA BIOPHARMA — header.js
   Sticky header, menu burger, sous-menu produits, scrollspy,
   boutons flottants haut/bas.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initBurgerMenu();
  initMobileSubmenu();
  initScrollspy();
  initFloatingScrollButtons();
});

/**
 * Ajoute .is-scrolled au header après un léger scroll (ombre + fond opaque).
 */
function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Ouvre/ferme le panneau de navigation mobile via le bouton burger.
 */
function initBurgerMenu() {
  const burger = document.querySelector('[data-burger]');
  const mobileNav = document.getElementById('mobile-nav');
  if (!burger || !mobileNav) return;

  const closeMenu = () => {
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.hidden = true;
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    burger.setAttribute('aria-expanded', 'true');
    mobileNav.hidden = false;
    // Force le reflow pour que la transition CSS s'applique
    requestAnimationFrame(() => mobileNav.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  };

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Ferme le menu au clic sur un lien d'ancre
  mobileNav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Ferme le menu avec la touche Échap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      burger.focus();
    }
  });
}

/**
 * Gère le sous-menu "Nos remèdes" en version mobile (accordéon)
 * et l'ouverture/fermeture au clic en version desktop (accessibilité clavier).
 */
function initMobileSubmenu() {
  // Accordéon mobile
  const mobileToggle = document.querySelector('[data-mobile-submenu-toggle]');
  const mobileSubmenu = document.querySelector('[data-mobile-submenu]');

  if (mobileToggle && mobileSubmenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileSubmenu.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Desktop : ouverture au clic (en plus du hover CSS), utile au clavier/tactile
  const desktopSubmenuWrap = document.querySelector('.has-submenu');
  const desktopToggle = document.querySelector('.submenu-toggle');

  if (desktopSubmenuWrap && desktopToggle) {
    desktopToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = desktopSubmenuWrap.classList.toggle('is-open');
      desktopToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!desktopSubmenuWrap.contains(e.target)) {
        desktopSubmenuWrap.classList.remove('is-open');
        desktopToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * Scrollspy : met en évidence le lien de navigation correspondant
 * à la section actuellement visible à l'écran.
 */
function initScrollspy() {
  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('.site-nav__link, .mobile-nav__link');
  if (!sections.length || !navLinks.length) return;

  const linksBySection = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const id = href.slice(1);
      if (!linksBySection.has(id)) linksBySection.set(id, []);
      linksBySection.get(id).push(link);
    }
  });

  const setActive = (id) => {
    navLinks.forEach((link) => link.classList.remove('is-active'));
    (linksBySection.get(id) || []).forEach((link) => link.classList.add('is-active'));
  };

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Affiche les boutons flottants (haut/bas) après un certain scroll,
 * et gère leur action.
 */
function initFloatingScrollButtons() {
  const wrapper = document.querySelector('[data-floating-scroll]');
  const upBtn = document.querySelector('[data-scroll-up]');
  const downBtn = document.querySelector('[data-scroll-down]');
  if (!wrapper) return;

  const onScroll = () => {
    wrapper.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  upBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  downBtn?.addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });
}
