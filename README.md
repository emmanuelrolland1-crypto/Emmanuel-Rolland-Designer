# Portfolio — Emmanuel Rolland

Site vitrine freelance de Lead UX / Product Designer.
Site statique : HTML, CSS et un petit script JavaScript sans dépendance. Aucun build nécessaire.

## Structure

```
.
├── index.html                      Accueil
├── galeries-lafayette.html         Réalisation — Galeries Lafayette
├── aroma-zone.html                 Réalisation — Aroma Zone
├── totalenergies.html              Réalisation — TotalEnergies
├── engie.html                      Réalisation — ENGIE
├── intelligence-artificielle.html  Réalisation — IA
├── methodologie.html               Méthodologie UX Research + podcast MANEW
├── assets/
│   ├── css/      une feuille de style par page
│   ├── js/       dc-runtime.js (moteur de rendu des pages)
│   └── images/   visuels WebP, portrait, logo, favicon
└── .nojekyll
```

## Mettre en ligne avec GitHub Pages

1. Créez un dépôt GitHub (par exemple `portfolio`) et déposez-y **le contenu** de ce dossier (pas le dossier lui-même).
2. Dans le dépôt : **Settings → Pages**.
3. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Après une à deux minutes, le site est en ligne sur `https://<votre-pseudo>.github.io/portfolio/`.

Pour un nom de domaine personnalisé, renseignez-le dans **Settings → Pages → Custom domain**.

## Tester en local

Ouvrir directement `index.html` peut bloquer certains navigateurs. Lancez plutôt un petit serveur depuis ce dossier :

```
python3 -m http.server 8000
```

puis ouvrez <http://localhost:8000>.

## Modifier le contenu

Dans chaque page HTML :

- **Textes fixes** : directement dans le `<template id="dc-template">`.
- **Contenus des galeries et carrousels** (titres, légendes, images) : dans le `<script type="text/x-dc">` en bas de page, dans les listes de données (`ITEMS`, `S`, `T`, `APP`…).
- **Couleurs et effets** : dans `assets/css/<page>.css` et dans les attributs `style` du template.

Les zones entre `{{ … }}` sont remplies automatiquement par le script : ne les supprimez pas.

## Polices

Instrument Serif et Geist, chargées depuis Google Fonts.
