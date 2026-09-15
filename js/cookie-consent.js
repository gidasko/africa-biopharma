/* ==========================================================================
   AFRICA BIOPHARMA — cookie-consent.js
   Bandeau cookies : Nécessaires (toujours actifs, aucun cookie tiers) /
   Fonctionnels (reCAPTCHA + Google Maps, nécessitent un consentement).
   Tant que le consentement "fonctionnels" n'est pas donné, ni le script
   reCAPTCHA ni l'iframe Google Maps ne sont chargés.
   ========================================================================== */

const COOKIE_CONSENT_KEY = 'abp_cookie_consent';
const RECAPTCHA_SITE_KEY = 'RECAPTCHA_SITE_KEY'; // même clé que js/order-modal.js

document.addEventListener('DOMContentLoaded', () => {
  const consent = readConsent();

  if (consent) {
    applyConsent(consent);
  } else {
    renderBanner();
  }

  // Le bouton "Afficher la carte" de la section contact donne un
  // consentement fonctionnel explicite en un clic.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-map-enable]')) {
      saveConsent({ necessary: true, functional: true });
      applyConsent({ necessary: true, functional: true });
    }
  });
});

function readConsent() {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function saveConsent(consent) {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ...consent, date: new Date().toISOString() }));
  } catch (err) {
    // Stockage indisponible (mode privé strict...) : le consentement
    // sera simplement redemandé à la prochaine visite.
  }
}

function applyConsent(consent) {
  if (consent.functional) {
    loadRecaptcha();
    enableMapButtons();
  }
}

/**
 * Charge le script reCAPTCHA v3 une seule fois.
 */
function loadRecaptcha() {
  if (window.grecaptcha || document.querySelector('[data-recaptcha-script]') || RECAPTCHA_SITE_KEY === 'RECAPTCHA_SITE_KEY') {
    return;
  }
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  script.setAttribute('data-recaptcha-script', 'true');
  document.head.appendChild(script);
}

/**
 * Remplace chaque placeholder de carte par l'iframe Google Maps réel.
 */
function enableMapButtons() {
  document.querySelectorAll('[data-map-container]').forEach((container) => {
    if (container.querySelector('iframe')) return; // déjà chargée

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.google.com/maps?q=Abomey-Calavi,+B%C3%A9nin&output=embed';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.title = "Localisation d'Africa Biopharma — Abomey-Calavi, Bénin";
    iframe.setAttribute('allowfullscreen', '');

    container.innerHTML = '';
    container.appendChild(iframe);
  });
}

/**
 * Construit et affiche le bandeau de consentement (première visite,
 * ou consentement expiré/effacé).
 */
function renderBanner() {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Gestion des cookies');

  banner.innerHTML = `
    <div class="cookie-banner__inner">
      <p class="cookie-banner__text">
        <strong>Nous respectons votre vie privée.</strong> Ce site utilise des cookies
        strictement nécessaires à son fonctionnement, ainsi que des cookies
        fonctionnels (reCAPTCHA, Google Maps) soumis à votre consentement.
        En savoir plus dans notre
        <a href="/pages/politique-confidentialite.html">politique de confidentialité</a>.
      </p>
      <div class="cookie-banner__actions">
        <button type="button" class="btn btn-secondary" data-cookie-customize>Personnaliser</button>
        <button type="button" class="btn btn-secondary" data-cookie-refuse>Refuser</button>
        <button type="button" class="btn btn-primary" data-cookie-accept>Tout accepter</button>
      </div>
    </div>
    <div class="cookie-panel" data-cookie-panel>
      <div class="cookie-panel__row">
        <div>
          <h5>Cookies nécessaires</h5>
          <p>Indispensables au fonctionnement du site (navigation, panier de commande). Toujours actifs.</p>
        </div>
        <span class="cookie-panel__toggle">
          <input type="checkbox" checked disabled aria-label="Cookies nécessaires, toujours actifs" />
          Toujours actifs
        </span>
      </div>
      <div class="cookie-panel__row">
        <div>
          <h5>Cookies fonctionnels</h5>
          <p>Protection anti-bot reCAPTCHA et affichage de la carte Google Maps.</p>
        </div>
        <span class="cookie-panel__toggle">
          <input type="checkbox" id="cookie-functional-toggle" />
          Activer
        </span>
      </div>
      <button type="button" class="btn btn-primary cookie-panel__save" data-cookie-save>
        Enregistrer mes choix
      </button>
    </div>
  `;

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('is-visible'));

  const panel = banner.querySelector('[data-cookie-panel]');
  const functionalToggle = banner.querySelector('#cookie-functional-toggle');

  function dismiss(consent) {
    saveConsent(consent);
    applyConsent(consent);
    banner.classList.remove('is-visible');
    window.setTimeout(() => banner.remove(), 450);
  }

  banner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
    dismiss({ necessary: true, functional: true });
  });

  banner.querySelector('[data-cookie-refuse]').addEventListener('click', () => {
    dismiss({ necessary: true, functional: false });
  });

  banner.querySelector('[data-cookie-customize]').addEventListener('click', () => {
    panel.classList.toggle('is-open');
  });

  banner.querySelector('[data-cookie-save]').addEventListener('click', () => {
    dismiss({ necessary: true, functional: functionalToggle.checked });
  });
}
