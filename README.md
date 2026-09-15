# Africa Biopharma — Site one-page premium

Site vitrine + boutique (commande sans paiement en ligne) pour **Africa Biopharma**,
projet de recherche et valorisation de la pharmacopée ouest-africaine porté par
l'association *Solidarité Sans Frontière* (Abomey-Calavi, Bénin).

## Stack technique

- **Frontend** : HTML5 sémantique + CSS natif (variables custom) + JavaScript vanilla
- **Backend** : Netlify Functions (Node.js) — envoi d'email, déclenchement WhatsApp, API admin
- **Base de données** : PostgreSQL (Supabase/Neon) ou MongoDB Atlas — portable hors Netlify
- **Stockage images** : Cloudinary (ou équivalent compatible S3)
- **Authentification admin** : email + mot de passe (bcrypt), session/JWT en cookie httpOnly
- **Anti-bot** : reCAPTCHA v3 invisible / hCaptcha + honeypot
- **Hébergement** : Netlify (provisoire) → hébergement classique + nom de domaine propre

Le prix de chaque produit, la galerie de 4 images par produit et les coordonnées de
contact du site sont **gérés dynamiquement en base de données** via le panneau
d'administration (Session 9) — jamais codés en dur dans le HTML.

## Arborescence

```
africa-biopharma/
├── index.html            # Page one-page (sections vides, à remplir sessions 2-7)
├── netlify.toml           # Config build, headers, redirections Netlify
├── robots.txt              # Disallow: /admin
├── sitemap.xml
├── site.webmanifest
├── README.md
├── assets/
│   ├── images/
│   │   ├── logo/
│   │   ├── hero/
│   │   ├── products/       # Images produits (fallback ; source de vérité = Cloudinary)
│   │   └── leaves/          # Motifs de feuilles en filigrane
│   └── icons/
├── css/
│   ├── base.css             # Variables, reset, typographie
│   ├── components.css       # Boutons, cartes, badges, conteneurs
│   ├── animations.css       # fade-in, slide-in, reveal au scroll
│   └── main.css             # Point d'entrée (imports)
├── js/
│   └── main.js               # Logique front vanilla (reveal au scroll, etc.)
├── functions/                # Netlify Functions (email, WhatsApp, API admin)
├── admin/                    # Panneau d'administration (Session 9)
└── pages/                    # Pages annexes (mentions légales, CGV — si besoin)
```

## Palette & typographie

| Rôle | Valeur |
|---|---|
| Vert primaire | `#00B050` |
| Vert primaire (foncé) | `#00753A` |
| Vert primaire (clair) | `#E6F7ED` |
| Or accent | `#FFCB00` |
| Or accent (foncé) | `#E6B800` |
| Fond crème | `#FBFAF6` |
| Texte | `#1A1A1A` / `#5A5A5A` (muted) |

- Titres : **Fraunces** (serif)
- Corps de texte : **Manrope** (sans-serif)

## Démarrage local

Aucun build requis pour le moment (HTML/CSS/JS natifs). Servir le dossier avec
n'importe quel serveur statique, par ex. :

```bash
npx serve .
```

## Variables d'environnement (Netlify)

À configurer dans **Netlify > Site settings > Environment variables**. Certaines
sont déjà nécessaires (Session 6-7), d'autres serviront au panneau
d'administration (Session 9) — toutes sont listées ici pour anticiper la
configuration complète du projet.

### Email (Sessions 6-7 — fonctions `send-order.js` / `send-contact.js`)

| Variable | Description |
|---|---|
| `SMTP_HOST` | Hôte SMTP (ex: smtp.gmail.com, ou celui de Resend/SendGrid) |
| `SMTP_PORT` | Port SMTP (ex: 587) |
| `SMTP_SECURE` | `"true"` si port 465, sinon `"false"` |
| `SMTP_USER` | Identifiant SMTP |
| `SMTP_PASSWORD` | Mot de passe / clé API SMTP |
| `ORDER_NOTIFY_EMAIL` | Adresse qui reçoit les commandes (`afrikapharma1@gmail.com` par défaut) |

### Anti-bot (Session 6)

| Variable | Description |
|---|---|
| `RECAPTCHA_SECRET_KEY` | Clé secrète reCAPTCHA v3 (jamais exposée au client) |
| `RECAPTCHA_MIN_SCORE` | Score minimal accepté (0 à 1, défaut recommandé : 0.5) |

Côté client, remplacer la valeur littérale `RECAPTCHA_SITE_KEY` (clé publique,
non secrète) dans : `<head>` de `index.html` (commentaire), `js/order-modal.js`
et `js/cookie-consent.js`.

### Base de données & stockage images (Session 9)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (Supabase/Neon) ou URI MongoDB Atlas, selon le choix fait en Session 9 |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary (upload sécurisé des images produits) |

### Authentification admin (Session 9)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret aléatoire long (32+ caractères) signant les sessions/JWT admin — à générer, ex. `openssl rand -base64 48` |
| `ADMIN_EMAIL` | Email du compte administrateur initial |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt du mot de passe admin (jamais le mot de passe en clair) |

### WhatsApp Business API (optionnel, au-delà du lien `wa.me` déjà en place)

| Variable | Description |
|---|---|
| `WHATSAPP_BUSINESS_TOKEN` | Jeton d'accès à l'API WhatsApp Business (Meta), si un envoi automatisé serveur-à-client est ajouté ultérieurement en plus de l'ouverture `wa.me` côté navigateur |
| `WHATSAPP_PHONE_NUMBER_ID` | Identifiant du numéro WhatsApp Business associé |

## Déploiement sur Netlify (configuration provisoire)

### Option A — Glisser-déposer (le plus rapide pour un premier aperçu)

1. Se rendre sur [app.netlify.com/drop](https://app.netlify.com/drop).
2. Glisser le dossier complet du projet (celui contenant `index.html` à la
   racine) dans la zone de dépôt.
3. Netlify attribue une URL provisoire du type `nom-aleatoire.netlify.app`.
4. ⚠️ Cette méthode ne déploie **pas** les Netlify Functions ni les variables
   d'environnement automatiquement : elle convient pour un aperçu visuel
   rapide, pas pour tester la commande (email/WhatsApp).

### Option B — Connexion Git (recommandée)

1. Pousser le projet sur un dépôt Git (GitHub, GitLab ou Bitbucket).
2. Sur [app.netlify.com](https://app.netlify.com), choisir **Add new site >
   Import an existing project**, puis sélectionner le dépôt.
3. Paramètres de build :
   - Build command : *(laisser vide — aucun build requis à ce stade, voir
     `PERFORMANCE.md` pour l'ajout futur d'une étape de minification)*
   - Publish directory : `.`
   - Functions directory : `functions` *(déjà défini dans `netlify.toml`,
     Netlify le détecte automatiquement)*
4. Dans **Site settings > Environment variables**, ajouter toutes les
   variables listées ci-dessus, au fur et à mesure qu'elles sont
   nécessaires (email dès maintenant, base de données/Cloudinary/JWT à
   la Session 9).
5. Déclencher un déploiement (`Trigger deploy` ou simplement un `git push`).
6. Vérifier que `/pages/*.html` et `/.netlify/functions/send-order` répondent
   correctement une fois en ligne.
7. Domaine provisoire : Netlify fournit une URL `*.netlify.app` ; un nom de
   domaine personnalisé peut déjà être branché ici via **Domain settings**
   si le nom de domaine définitif est prêt, sans attendre la migration.

## Migration vers un hébergement définitif

Le projet a été conçu (Session 1) pour rester **portable** : HTML/CSS/JS
natifs, base de données externe (Supabase/Neon/MongoDB Atlas, hors Netlify),
stockage d'images externe (Cloudinary). La migration ne nécessite donc pas de
réécrire le site, seulement de déplacer l'hébergement et la configuration.

1. **Export du frontend** : le dossier du projet (HTML/CSS/JS/`assets/`) est
   directement réutilisable sur n'importe quel hébergement statique (VPS avec
   Nginx/Apache, autre plateforme JAMstack, etc.). Aucune dépendance à
   l'infrastructure Netlify dans le code du frontend.
2. **Migration du backend Node.js** : les fichiers de `/functions/` (Netlify
   Functions) exportent chacun un `handler` au format Netlify/AWS Lambda.
   Pour un hébergement classique, les adapter en routes Express (ou
   équivalent) — la logique métier (vérification honeypot/reCAPTCHA,
   construction de l'email, requêtes base de données) reste identique ; seule
   l'enveloppe `exports.handler = async (event) => {...}` change pour une
   route `app.post('/api/send-order', async (req, res) => {...})`.
3. **Base de données et Cloudinary** : aucune migration nécessaire si ces
   services restent les mêmes (ils sont déjà externes à Netlify) ; sinon,
   exporter/réimporter les données et mettre à jour `DATABASE_URL` /
   `CLOUDINARY_*` sur le nouvel environnement.
4. **Configuration DNS** : pointer le nom de domaine définitif
   (`africabiopharma.com` ou équivalent) vers le nouvel hébergeur via un
   enregistrement `A` (IP du serveur) ou `CNAME` (si hébergement JAMstack),
   selon les instructions de l'hébergeur cible.
5. **Certificat SSL** : la plupart des hébergeurs modernes (et tout serveur
   avec Let's Encrypt/Certbot) génèrent un certificat automatiquement dès
   que le DNS pointe correctement ; vérifier que le HTTPS est actif avant de
   rediriger le trafic définitivement.
6. **Mise à jour de l'URL canonique** : remplacer toutes les occurrences de
   `https://www.africabiopharma.com/` (actuellement utilisées comme URL de
   référence provisoire) par le nom de domaine réel dans :
   - les balises `<link rel="canonical">` et Open Graph/Twitter de chaque
     page (`index.html` et `/pages/*.html`) ;
   - `sitemap.xml` (toutes les `<loc>`) ;
   - `robots.txt` (ligne `Sitemap:`) ;
   - les blocs JSON-LD (`Organization`, `Product`, `Article`,
     `BreadcrumbList`) dans `<head>` de `index.html` et `/pages/article-type.html`.
7. **Soumission aux moteurs de recherche** : une fois le domaine définitif en
   ligne avec HTTPS, soumettre le nouveau `sitemap.xml` dans Google Search
   Console (et Bing Webmaster Tools) pour accélérer la réindexation.


## Panneau d'administration (Session 9)

### Mise en place initiale

1. **Créer la base de données** (PostgreSQL via Supabase ou Neon, comme
   défini en Session 1) et exécuter `schema.sql` une fois dessus (tables
   `products`, `contact_settings`, `admin_users`, `login_attempts`, avec les
   8 produits et les coordonnées par défaut préremplis).
2. **Configurer les variables d'environnement** sur Netlify : au minimum
   `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (voir tableau plus haut).
3. **Créer le premier compte admin**, en local, avec la variable
   `DATABASE_URL` pointant vers la base de production :
   ```bash
   cd functions && npm install
   DATABASE_URL="postgres://..." node ../scripts/create-admin.js \
     admin@africabiopharma.com "UnMotDePasseSolide!23"
   ```
   Ce script hache le mot de passe avec bcrypt avant de l'insérer : le mot
   de passe en clair n'est jamais stocké ni transmis au-delà de cette
   commande locale.
4. Se connecter sur `https://votre-site/admin/login.html`.

### Utilisation

- **`/admin/dashboard.html`** : liste des 8 produits, avec leur miniature et
  prix actuel. Cliquer sur un produit pour le modifier.
- **`/admin/produit.html?slug=...`** : modifier le prix (laisser vide pour
  afficher « Prix sur demande ») et gérer les 4 emplacements d'image
  (upload, suppression, réordonnancement par flèches). Un aperçu à droite
  reproduit exactement le slider tel qu'affiché sur le site public.
- **`/admin/contact.html`** : modifier les coordonnées affichées partout sur
  le site (header, footer, section Contact, liens WhatsApp).

Toute modification enregistrée devient visible sur le site public en
quelques secondes (le cache de l'endpoint `/functions/public-data.js` est
volontairement court — 30 secondes).

### Sécurité

- Toutes les routes `/admin/*` et tous les endpoints d'écriture vérifient un
  cookie de session JWT `httpOnly` + `secure` avant d'exécuter la moindre
  action (voir `functions/_lib/auth.js`).
- Les tentatives de connexion échouées sont journalisées ; après 5 échecs en
  15 minutes pour un même email, les connexions sont bloquées temporairement.
- Toutes les pages admin portent `<meta name="robots" content="noindex,
  nofollow">` et `/robots.txt` exclut `/admin` de l'indexation.


Voir `PERFORMANCE.md` pour la checklist détaillée (objectif Lighthouse > 90) :
ce qui est déjà en place dans le code (polices, scripts différés, cache) et ce
qui reste à faire manuellement avant mise en ligne (images définitives en
WebP, minification CSS/JS).

## Roadmap des sessions

1. ✅ Cadrage, stack, design system, structure de dossiers
2. ✅ Header, navigation, section hero
3. ✅ Qui sommes-nous, agréments & reconnaissances
4. ✅ Fiches produits (1/2) : Biokamel, Bio-Alpha 12®, Bio-DK, Bio-Gamma 5
5. ✅ Fiches produits (2/2) : Charbon Bio Magic, Bio-Hepa 3, Bioforce, Biovitalis
6. ✅ Commande rapide (email + WhatsApp), partage social, anti-bot
7. ✅ Footer, contact, blog, conformité RGPD Bénin (APDP), bandeau cookies
8. ✅ SEO technique (Schema.org, sitemap, OG/Twitter), performance, déploiement Netlify
9. ✅ Panneau d'administration (auth, CRUD prix/images/contact)

Le site est maintenant complet et connecté de bout en bout : toute donnée
modifiée dans `/admin/` (prix, images, coordonnées) se reflète automatiquement
sur le site public via `/functions/public-data.js`.
