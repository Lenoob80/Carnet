# Carnet 4.0.1 — correctifs ciblés et validation

## Correctifs inclus
- Les rubriques Cours et Pronote peuvent être masquées depuis Paramètres > Navigation, comme les autres rubriques. Paramètres reste accessible.
- Suppression des flèches de déplacement sous les widgets de l'accueil. Les widgets peuvent toujours être affichés/masqués dans Personnaliser les widgets.
- L'agenda hebdomadaire utilise 7 colonnes (lundi à dimanche). Sur écran étroit, la rangée défile horizontalement au lieu de passer le week-end sur une deuxième ligne.
- Le relais, Pawnote, les données existantes et le contenu de Mon carnet sont conservés tels quels dans cette archive.

## Vérifications effectuées automatiquement
- `node --check` sur les fichiers JavaScript du site, du build Pawnote et du relais.
- Vérification des références locales de scripts depuis `index.html`.
- Vérification de l'intégrité de l'archive ZIP.

## Vérifications restant à faire en environnement réel
Une connexion avec le compte ENT HDF de l'utilisateur, la synchronisation Pronote, l'affichage sur un iPhone réel et la restauration d'une sauvegarde réelle ne peuvent pas être certifiés depuis cet environnement. Faire ces tests après déploiement, sans supprimer l'ancienne version ni les sauvegardes.
