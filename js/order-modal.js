/* ==========================================================================
   AFRICA BIOPHARMA — order-modal.js
   Modale de commande rapide déclenchée par les boutons "Acheter maintenant".
   Gère : pré-remplissage produit, validation, honeypot, reCAPTCHA v3,
   appel à la Netlify Function d'envoi, ouverture WhatsApp, confirmation.

   VARIABLES À CONFIGURER :
   - RECAPTCHA_SITE_KEY (clé publique) : voir la balise <script> reCAPTCHA
     dans le <head> de index.html.
   - Numéro WhatsApp par défaut : défini ci-dessous (WHATSAPP_DEFAULT_NUMBER).
     Sera remplacé, en Session 9, par la valeur enregistrée dans les
     réglages admin (chargée dynamiquement depuis la base de données).
   ========================================================================== */

// Valeurs par défaut — seront chargées depuis les réglages admin (Session 9)
const WHATSAPP_DEFAULT_NUMBER = '2290195193491'; // +229 01 95 19 34 91, sans "+" ni espaces
const RECAPTCHA_SITE_KEY = 'RECAPTCHA_SITE_KEY'; // à remplacer par la vraie clé publique

document.addEventListener('DOMContentLoaded', () => {
  initOrderModal();
});

function initOrderModal() {
  const modal = document.getElementById('order-modal');
  const form = document.getElementById('order-form');
  if (!modal || !form) return;

  const productInput = document.getElementById('order-product');
  const statusWrap = modal.querySelector('[data-order-status]');
  const statusText = modal.querySelector('[data-order-status-text]');
  const spinner = modal.querySelector('[data-order-spinner]');
  const submitBtn = modal.querySelector('[data-order-submit]');
  const submitLabel = modal.querySelector('[data-order-submit-label]');
  const errorEl = modal.querySelector('[data-order-error]');
  const honeypot = document.getElementById('order-honeypot');

  let currentProductSlug = null;
  let lastFocusedEl = null;

  // ---------- Ouverture depuis chaque bouton "Acheter maintenant" ----------
  document.querySelectorAll('[data-product]').forEach((btn) => {
    if (!btn.id.startsWith('buy-')) return;
    btn.addEventListener('click', () => {
      currentProductSlug = btn.id.replace('buy-', '');
      const productName = btn.dataset.product || '';
      lastFocusedEl = btn;
      openModal(productName);
    });
  });

  function openModal(productName) {
    resetForm();
    productInput.value = productName;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => document.getElementById('order-name')?.focus(), 50);
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocusedEl?.focus();
  }

  modal.querySelectorAll('[data-order-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  function resetForm() {
    form.reset();
    form.hidden = false;
    statusWrap.hidden = true;
    statusWrap.removeAttribute('data-state');
    errorEl.hidden = true;
    errorEl.textContent = '';
    setLoading(false);
    document.getElementById('order-quantity').value = 1;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    spinner.hidden = true;
    submitLabel.textContent = isLoading ? 'Envoi en cours...' : 'Envoyer ma demande';
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function showSuccess() {
    form.hidden = true;
    statusWrap.hidden = false;
    statusWrap.setAttribute('data-state', 'success');
    statusText.textContent = 'Votre demande a bien été transmise. Notre équipe vous recontacte très prochainement sur WhatsApp.';
  }

  // ---------- Soumission ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Piège à bots : un champ rempli = comportement non-humain probable.
    // On ne prévient jamais l'expéditeur ; on simule un envoi normal puis
    // on abandonne silencieusement (le serveur revérifie aussi ce champ).
    if (honeypot.value.trim() !== '') {
      setLoading(true);
      window.setTimeout(() => {
        setLoading(false);
        showSuccess();
      }, 900);
      return;
    }

    setLoading(true);
    spinner.hidden = false;

    try {
      const token = await getRecaptchaToken();

      const slug = currentProductSlug;
      const productData = window.PRODUCTS_DATA?.[slug];
      const price = productData ? productData.price : null;
      const quantity = parseInt(document.getElementById('order-quantity').value, 10) || 1;
      const totalPrice = price !== null && price !== undefined ? price * quantity : null;

      const payload = {
        produit: productInput.value,
        prixUnitaire: price,
        quantite: quantity,
        prixTotal: totalPrice,
        nom: document.getElementById('order-name').value.trim(),
        telephone: document.getElementById('order-phone').value.trim(),
        ville: document.getElementById('order-city').value.trim(),
        message: document.getElementById('order-message').value.trim(),
        consentement: document.getElementById('order-consent').checked,
        honeypot: honeypot.value, // doit rester vide — revérifié côté serveur
        recaptchaToken: token
      };

      const response = await fetch('/.netlify/functions/send-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('server-error');
      }

      // Ouvre WhatsApp avec le récapitulatif, en complément de l'email
      openWhatsAppSummary(payload);

      showSuccess();
    } catch (err) {
      showError("Une erreur est survenue lors de l'envoi. Merci de réessayer, ou de nous contacter directement par WhatsApp.");
    } finally {
      setLoading(false);
      spinner.hidden = true;
    }
  });

  /**
   * Récupère un jeton reCAPTCHA v3 invisible. Si le script n'a pas pu
   * charger (réseau, bloqueur de pub...), on n'empêche pas l'envoi côté
   * client : la vérification finale a de toute façon lieu côté serveur.
   */
  function getRecaptchaToken() {
    return new Promise((resolve) => {
      if (!window.grecaptcha || RECAPTCHA_SITE_KEY === 'RECAPTCHA_SITE_KEY') {
        resolve(null);
        return;
      }
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action: 'submit_order' })
          .then(resolve)
          .catch(() => resolve(null));
      });
    });
  }

  function formatPriceLine(price, quantity, total) {
    if (price === null || price === undefined) {
      return 'Prix : sur demande';
    }
    const unit = Number(price).toLocaleString('fr-FR');
    const totalFmt = Number(total).toLocaleString('fr-FR');
    return `Prix unitaire : ${unit} FCFA\nQuantité : ${quantity}\nTotal : ${totalFmt} FCFA`;
  }

  function openWhatsAppSummary(payload) {
    const lines = [
      `Nouvelle demande de commande — ${payload.produit}`,
      formatPriceLine(payload.prixUnitaire, payload.quantite, payload.prixTotal),
      `Nom : ${payload.nom}`,
      `Téléphone : ${payload.telephone}`,
      `Ville/Quartier : ${payload.ville}`,
      payload.message ? `Message : ${payload.message}` : null
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_DEFAULT_NUMBER}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
