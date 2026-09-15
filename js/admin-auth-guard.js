/* ==========================================================================
   AFRICA BIOPHARMA — admin-auth-guard.js
   Chargé sur toutes les pages admin protégées (dashboard, produit, contact).
   Fournit window.adminFetch(), un wrapper fetch qui envoie le cookie de
   session et redirige automatiquement vers /admin/login.html si la réponse
   est 401 (session expirée ou absente). Gère aussi le bouton "Se déconnecter".
   ========================================================================== */

window.adminFetch = async function adminFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    window.location.replace('/admin/login.html');
    // Empêche le code appelant de continuer à traiter une réponse invalide.
    throw new Error('unauthorized');
  }

  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await fetch('/.netlify/functions/admin-logout', {
          method: 'POST',
          credentials: 'include'
        });
      } finally {
        window.location.replace('/admin/login.html');
      }
    });
  });
});
