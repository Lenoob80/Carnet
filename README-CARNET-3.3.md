# Carnet 3.3 — espace de travail OneNote

## Changements
- Sections présentées sous forme d’onglets horizontaux colorés.
- Liste des pages séparée de la zone d’édition, avec sous-pages simples.
- Couleur de chaque section modifiable via le point coloré.
- Outils existants rendus plus accessibles : modèles, étiquettes, liens entre pages, dessin, historique et export.
- Ajout de l’action « Note rapide » qui insère un bloc de texte dans la page actuelle.
- Zone de page libérée du cadre blanc à largeur fixe : canevas fluide, hauteur qui s’adapte au contenu.
- Barre de mise en forme repositionnée sous la navigation afin d’éviter le chevauchement lors du défilement.

## Conservation
Les données existantes, la structure des carnets/sections/pages, le relais Pronote, Pawnote et la synchronisation sont conservés. Les sous-pages utilisent le champ `parentId` facultatif sur les pages existantes.

## Installation
Remplacer les fichiers du dépôt GitHub par le contenu du dossier `Carnet`, puis recharger le site avec Ctrl+F5. Le service worker utilise une nouvelle version de cache.
