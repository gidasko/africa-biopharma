/* ==========================================================================
   AFRICA BIOPHARMA — contact-form.js
   Formulaire de contact générique de la section #contact. Réutilise le
   même mécanisme anti-bot (honeypot + reCAPTCHA v3) et la même double
   notification (email + WhatsApp) que la modale de commande (Session 6),
   via la Netlify Function /functions/send-contact.js.
   ========================================================================== */

const RECAPTCHA_SITE_KEY_CONTACT = 'RECAPTCHA_SITE_KEY'; // même clé que js/order-modal.js

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
});

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('[data-contact-submit]');
  const submitLabel = form.querySelector('[data-contact-submit-label]');
  const errorEl = form.querySelector('[data-contact-error]');
  const statusWrap = form.querySelector('[data-contact-status]');
  const statusText = form.querySelector('[data-contact-status-text]');
  const honeypot = document.getElementById('contact-honeypot');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Piège à bots : rejet silencieux, aucun indice donné au bot.
    if (honeypot.value.trim() !== '') {
      setLoading(true);
      window.setTimeout(() => {
        setLoading(false);
        showSuccess();
      }, 900);
      return;
    }

    setLoading(true);

    try {
      const token = await getRecaptchaToken();

      const payload = {
        nom: document.getElementById('contact-name').value.trim(),
        email: document.getElementById('contact-email').value.trim(),
        telephone: document.getElementById('contact-phone').value.trim(),
        message: document.getElementById('contact-message').value.trim(),
        consentement: document.getElementById('contact-consent').checked,
        honeypot: honeypot.value,
        recaptchaToken: token
      };

      const response = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('server-error');

      openWhatsAppSummary(payload);
      showSuccess();
    } catch (err) {
      errorEl.textContent = "Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement par WhatsApp.";
      errorEl.hidden = false;
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitLabel.textContent = isLoading ? 'Envoi en cours...' : 'Envoyer le message';
  }

  function showSuccess() {
    form.querySelectorAll('input, textarea, button[type="submit"]').forEach((el) => {
      el.disabled = true;
    });
    statusWrap.hidden = false;
    statusText.textContent = 'Votre message a bien été transmis. Notre équipe vous recontacte très prochainement.';
  }

  function getRecaptchaToken() {
    return new Promise((resolve) => {
      if (!window.grecaptcha || RECAPTCHA_SITE_KEY_CONTACT === 'RECAPTCHA_SITE_KEY') {
        resolve(null);
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY_CONTACT, { action: 'submit_contact' })
          .then(resolve)
          .catch(() => resolve(null));
      });
    });
  }

  function openWhatsAppSummary(payload) {
    const number = window.SITE_CONTACT?.whatsappNumber || '2290195193491';
    const lines = [
      'Nouveau message via le formulaire de contact du site',
      `Nom : ${payload.nom}`,
      payload.email ? `Email : ${payload.email}` : null,
      `Téléphone : ${payload.telephone}`,
      `Message : ${payload.message}`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${number}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
