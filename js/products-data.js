/* ==========================================================================
   AFRICA BIOPHARMA — products-data.js
   Données provisoires des produits (prix + galerie d'images).
   À terme (Session 9), ces valeurs seront chargées depuis la base de
   données via l'API du panneau d'administration, au lieu d'être codées
   en dur ici. La structure (price / images[]) est conçue pour rester
   identique afin de ne rien casser au moment du branchement.

   REMPLACER LES IMAGES PLACEHOLDER CI-DESSOUS PAR LES VISUELS OFFICIELS
   DE CHAQUE PRODUIT (1 à 4 photos), une fois disponibles.
   ========================================================================== */

window.PRODUCTS_DATA = {
  biokamel: {
    price: null, // en FCFA, ex: 15000. null => "Prix sur demande"
    images: [
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611071536052-5d4c1b1c8e0e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  'bio-alpha-12': {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600959907703-125ba1374a12?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  'bio-dk': {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611071536052-5d4c1b1c8e0e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  'bio-gamma-5': {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1512428813834-c702c7702b78?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600959907703-125ba1374a12?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  'charbon-bio-magic': {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611071536052-5d4c1b1c8e0e?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  'bio-hepa-3': {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600959907703-125ba1374a12?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  bioforce: {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611071536052-5d4c1b1c8e0e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600959907703-125ba1374a12?q=80&w=1200&auto=format&fit=crop'
    ]
  },
  biovitalis: {
    price: null,
    images: [
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512428813834-c702c7702b78?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop'
    ]
  }
};

/**
 * Formate le prix d'un produit pour affichage.
 * @param {number|null} price
 * @returns {string}
 */
window.formatProductPrice = function formatProductPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Prix sur demande';
  }
  return `${Number(price).toLocaleString('fr-FR')} FCFA`;
};

/* ==========================================================================
   Chargement dynamique depuis la base de données (Session 9)
   ==========================================================================
   Les objets ci-dessus servent de valeurs par défaut, affichées
   immédiatement pour un premier rendu rapide. Dès que l'API répond, les
   vraies valeurs (saisies via le panneau d'administration) les remplacent,
   et un événement est déclenché pour que le slider d'images et le badge
   prix (js/product-slider.js) se (re)construisent avec les données à jour.
   Si l'API est indisponible, le site continue de fonctionner avec les
   valeurs par défaut ci-dessus — l'événement est déclenché dans tous les cas.
   ========================================================================== */
(function loadDynamicProductsData() {
  fetch('/.netlify/functions/public-data')
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('bad-response'))))
    .then((result) => {
      if (!result.ok || !result.products) return;
      Object.keys(result.products).forEach((slug) => {
        if (window.PRODUCTS_DATA[slug]) {
          window.PRODUCTS_DATA[slug] = { ...window.PRODUCTS_DATA[slug], ...result.products[slug] };
        }
      });
    })
    .catch(() => {
      // API indisponible : on garde les valeurs par défaut définies plus haut.
    })
    .finally(() => {
      window.dispatchEvent(new CustomEvent('products-data-ready'));
    });
})();

