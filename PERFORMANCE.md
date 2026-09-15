# Performance — checklist Lighthouse (objectif > 90)

Ce document récapitule ce qui est déjà en place dans le code livré, et ce qui
reste à faire manuellement (images définitives, build de production) avant
mise en ligne.

## ✅ Déjà en place dans le code

- **Polices** : `preconnect` vers `fonts.googleapis.com`/`fonts.gstatic.com` +
  `preload` de la feuille de style Google Fonts + `font-display: swap` (le
  texte s'affiche immédiatement avec une police système, puis bascule sans
  provoquer de saut de mise en page brutal). Voir `<head>` de `index.html`.
- **JS non bloquant** : tous les `<script>` du site utilisent l'attribut
  `defer` — aucun script ne bloque le parsing du HTML.
- **CSS ciblé** : les fichiers CSS sont séparés par section (`header.css`,
  `hero.css`, `produits.css`...) et chargés via un seul `main.css` qui les
  `@import`e ; à la minification (voir plus bas), un seul fichier CSS sort
  du build, donc une seule requête réseau malgré la séparation en sources.
- **Images produits/hero/blog** : `loading="lazy"` sur toutes les images hors
  above-the-fold (le hero, qui doit s'afficher immédiatement, n'est pas
  lazy-loadé).
- **Scripts tiers différés** : reCAPTCHA et Google Maps ne se chargent
  qu'après consentement aux cookies fonctionnels (`cookie-consent.js`) — ils
  ne pénalisent donc pas le chargement initial pour la majorité des visiteurs
  tant qu'ils n'ont pas interagi avec le bandeau.
- **Cache navigateur** : `netlify.toml` définit un `Cache-Control` long
  (`max-age=31536000, immutable`) pour CSS/JS/assets/fonts, et un cache court
  pour le HTML (pour que les mises à jour de contenu — prix, contact — soient
  visibles rapidement une fois branchées en Session 9).
- **Pas de JS custom bloquant le rendu** : toute la logique interactive
  (slider, scrollspy, compteurs...) s'exécute après `DOMContentLoaded`.

## 🔲 À faire avant la mise en ligne définitive

1. **Remplacer les images placeholder Unsplash par les visuels officiels**,
   exportés en **WebP** (avec fallback JPEG via `<picture>` si nécessaire),
   compressés et dimensionnés à la taille réellement affichée (éviter de
   servir une image 4000px de large pour un affichage de 600px). Le service
   de stockage prévu (Cloudinary, Session 9) peut générer ces variantes
   automatiquement via ses paramètres d'URL (`f_auto,q_auto`).
2. **Minifier CSS et JS** avant déploiement en production. Aucune étape de
   build n'existe à ce stade (le projet est en HTML/CSS/JS natifs, comme
   défini en Session 1) ; à l'ajout d'un build simple, par exemple :
   ```bash
   npx lightningcss --minify --bundle css/main.css -o dist/css/main.min.css
   npx esbuild js/*.js --bundle --minify --outdir=dist/js
   ```
   puis mise à jour des chemins dans le HTML vers `dist/`.
3. **Compresser les icônes/manifest** (`/assets/icons/*.png`) — utiliser des
   PNG optimisés (`pngquant`/`oxipng`) ou du SVG quand c'est possible.
4. **Vérifier l'absence de contenu bloquant le rendu** une fois les visuels
   officiels intégrés : si des `<img>` supplémentaires sont ajoutées
   au-dessus de la ligne de flottaison (hero, header), leur poids doit rester
   raisonnable (< 200 Ko chacune, idéalement).
5. **Auditer avec Lighthouse** (Chrome DevTools ou `npx lighthouse
   https://votre-url --view`) une fois le site déployé sur Netlify, pour
   confirmer le score et ajuster si un point précis ressort (ex : CLS dû à
   une image sans dimensions explicites — penser à ajouter `width`/`height`
   ou `aspect-ratio` CSS sur les visuels définitifs).

## Rappel : hiérarchie des titres

Chaque page du site ne contient qu'un seul `<h1>` :
- `index.html` : le titre du hero (« LA PHARMACOPÉE BÉNINOISE... »).
- Chaque page annexe (`/pages/*.html`) : le titre de la page.

Les titres de section utilisent `<h2>`, les sous-titres `<h3>`, et les
titres de carte/composant `<h4>`, sans saut de niveau.
