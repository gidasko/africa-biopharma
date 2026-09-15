/* ==========================================================================
   AFRICA BIOPHARMA — admin-login.js
   Soumission du formulaire de connexion admin.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const submitBtn = form.querySelector('[data-login-submit]');
  const submitLabel = form.querySelector('[data-login-submit-label]');
  const errorEl = form.querySelector('[data-login-error]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Connexion...';

    try {
      const response = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: document.getElementById('admin-email').value.trim(),
          password: document.getElementById('admin-password').value
        })
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        errorEl.textContent = result.error || 'Connexion impossible.';
        errorEl.hidden = false;
        return;
      }

      window.location.href = '/admin/dashboard.html';
    } catch (err) {
      errorEl.textContent = 'Erreur réseau. Merci de réessayer.';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Se connecter';
    }
  });
});
