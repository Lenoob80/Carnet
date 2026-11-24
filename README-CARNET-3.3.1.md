# Carnet 3.3.1 — stabilité de l'espace de travail

Cette version corrige la mise en page de l'éditeur historique sans modifier le format des données personnelles.

## Correctifs
- Ruban Accueil / Insérer / Tableau / Disposition / Page compact et défilant horizontalement.
- Ruban sticky sous la navigation globale, et sous la barre de recherche en mode Concentration.
- Mise en page fluide automatique quand les blocs libres dépassent la largeur disponible : les blocs sont empilés verticalement pour éviter les débordements et le défilement horizontal de toute la page.
- Les coordonnées et largeurs d'origine des blocs restent conservées dans les styles en ligne et dans les données enregistrées. Le mode fluide ne réécrit pas ces coordonnées.
- Bouton d'état dans le ruban pour basculer manuellement entre mise en page adaptée et disposition libre.
- Défilement horizontal limité aux tableaux qui en ont réellement besoin.
- Action volontaire « Aa Corriger les accents » pour réparer les séquences de texte mal encodées détectées dans la page courante. Rien n'est modifié automatiquement.
- Cache du service worker renouvelé.

## Important
Le contenu personnel du carnet est stocké dans le navigateur et dans le dépôt privé configuré par l'utilisateur. Cette archive ne contient pas ces données. Faire une sauvegarde habituelle avant remplacement des fichiers GitHub.
