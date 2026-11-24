# Carnet 3.3.4 — récupération de l’espace de travail

## Correctifs
- Corrige la grille de Mon carnet : ruban des sections en haut, pages à gauche, éditeur à droite.
- Empêche les règles flex héritées de masquer la liste des pages.
- Relance le rendu après l’entrée dans Mon carnet, une fois les dimensions appliquées.
- Active la mise en page empilée uniquement si les blocs dépassent la largeur de la page ; les coordonnées enregistrées ne sont pas réécrites.
- Ajoute une action explicite de correction des caractères mal encodés (avec confirmation).
- Affiche les étapes du déchiffrement et du chargement lors de la connexion.
- Renouvelle le cache du service worker.

## Données
Aucune donnée locale, aucun identifiant, aucun jeton GitHub et aucune page n’est supprimé par ce correctif. Ne pas effacer le stockage du navigateur.

## Installation
Remplacer le contenu du dépôt GitHub Pages par le contenu de ce dossier `Carnet`, puis attendre le déploiement. Conserver séparément le relais et le dossier de build Pawnote s’ils sont hébergés dans d’autres services.
