/* ==========================================================================
   AFRICA BIOPHARMA — site-contact.js
   Coordonnées provisoires du site, centralisées en un seul endroit.
   Header, footer et section #contact lisent toutes cet objet plutôt que
   de dupliquer les valeurs en dur dans le HTML. À terme (Session 9), ces
   valeurs seront chargées depuis la base de données via les réglages
   admin, sans changer la façon dont le reste du site les consomme.
   ========================================================================== */

window.SITE_CONTACT = {
  phone1: '+229 01 95 19 34 91',
  phone2: '+229 01 41 67 04 42',
  whatsappNumber: '2290195193491', // format international sans "+" ni espaces, pour wa.me
  email: 'afrikapharma1@gmail.com',
  addressLine: 'Abomey-Calavi, BÉNIN — 03 BP 3949 Jéricho',
  tagline: "Pour une Afrique en bonne santé, construite par elle-même."
};

document.addEventListener('DOMContentLoaded', () => {
  applySiteContact(); // premier rendu immédiat avec les valeurs par défaut
  loadDynamicContact();
});

/**
 * Charge les coordonnées réelles depuis la base de données (Session 9) et
 * réapplique applySiteContact() une fois reçues. En cas d'échec, les
 * valeurs par défaut définies plus haut restent affichées.
 */
function loadDynamicContact() {
  fetch('/.netlify/functions/public-data')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('bad-response'))))
    .then((result) => {
      if (!result.ok || !result.contact) return;
      Object.keys(result.contact).forEach((key) => {
        if (result.contact[key] !== null && result.contact[key] !== undefined) {
          window.SITE_CONTACT[key] = result.contact[key];
        }
      });
      applySiteContact();
    })
    .catch(() => {
      // API indisponible : les valeurs par défaut restent affichées.
    });
}

/**
 * Injecte les coordonnées dans tous les éléments marqués par des
 * attributs data-contact-*, où qu'ils se trouvent dans la page
 * (header, footer, section contact, pages annexes...).
 */
function applySiteContact() {
  const c = window.SITE_CONTACT;

  document.querySelectorAll('[data-contact-phone1]').forEach((el) => {
    el.textContent = c.phone1;
    if (el.tagName === 'A') el.href = `tel:${c.phone1.replace(/\s+/g, '')}`;
  });

  document.querySelectorAll('[data-contact-phone2]').forEach((el) => {
    el.textContent = c.phone2;
    if (el.tagName === 'A') el.href = `tel:${c.phone2.replace(/\s+/g, '')}`;
  });

  document.querySelectorAll('[data-contact-email]').forEach((el) => {
    el.textContent = c.email;
    if (el.tagName === 'A') el.href = `mailto:${c.email}`;
  });

  document.querySelectorAll('[data-contact-address]').forEach((el) => {
    el.textContent = c.addressLine;
  });

  document.querySelectorAll('[data-contact-tagline]').forEach((el) => {
    el.textContent = `« ${c.tagline} »`;
  });

  document.querySelectorAll('[data-contact-whatsapp-link]').forEach((el) => {
    el.href = `https://wa.me/${c.whatsappNumber}`;
  });

  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}
