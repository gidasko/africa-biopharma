/* ==========================================================================
   AFRICA BIOPHARMA — admin-contact.js
   Charge les réglages de contact actuels, pré-remplit le formulaire,
   et enregistre les modifications.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.querySelector('[data-contact-status]');
  const form = document.querySelector('[data-contact-form]');

  try {
    const response = await window.adminFetch('/.netlify/functions/admin-contact');
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'Erreur inconnue.');

    document.getElementById('settings-phone1').value = result.contact.phone1 || '';
    document.getElementById('settings-phone2').value = result.contact.phone2 || '';
    document.getElementById('settings-email').value = result.contact.email || '';
    document.getElementById('settings-address').value = result.contact.address || '';

    form.hidden = false;
    statusEl.hidden = true;
  } catch (err) {
    if (err.message === 'unauthorized') return;
    statusEl.textContent = 'Impossible de charger les réglages de contact.';
    statusEl.dataset.state = 'error';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[data-save-contact]');
    const submitLabel = form.querySelector('[data-save-contact-label]');
    const feedback = form.querySelector('[data-contact-feedback]');

    submitBtn.disabled = true;
    submitLabel.textContent = 'Enregistrement...';
    feedback.hidden = true;

    try {
      const response = await window.adminFetch('/.netlify/functions/admin-contact', {
        method: 'POST',
        body: JSON.stringify({
          phone1: document.getElementById('settings-phone1').value.trim(),
          phone2: document.getElementById('settings-phone2').value.trim(),
          email: document.getElementById('settings-email').value.trim(),
          address: document.getElementById('settings-address').value.trim()
        })
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Échec de l'enregistrement.");

      feedback.textContent = 'Coordonnées enregistrées ✓';
      feedback.dataset.state = 'success';
      feedback.hidden = false;
    } catch (err) {
      if (err.message === 'unauthorized') return;
      feedback.textContent = err.message || "Échec de l'enregistrement.";
      feedback.dataset.state = 'error';
      feedback.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Enregistrer';
    }
  });
});
