# Carnet 4.0 — Espace scolaire enrichi

Cette version ajoute des outils à l’espace scolaire sans refondre ni remplacer l’éditeur historique « Mon carnet ».

## Nouveautés
- Accueil avec widgets activables, masquables et réorganisables.
- Agenda Jour / Semaine / Mois, pauses entre cours et événements personnels.
- Devoirs avec filtres, priorités et tâches personnelles.
- Notes avec simulateur de moyenne et objectifs personnels par matière.
- Rubrique Cours avec fiches par matière et sauvegarde automatique.
- Révisions par cartes mémoire, répétition espacée et quiz à choix multiples généré à partir des cartes.
- Bibliothèque de documents classés par matière, avec recherche par nom/matière, filtres et aperçu PDF / image.
- Statistiques : moyennes par matière, tendance mensuelle, heures de cours importées et suivi des devoirs.
- Notifications Pronote et rappels personnels (l’application doit rester ouverte pour les rappels locaux).
- Paramètres d’apparence, couleur d’accentuation, densité, navigation et sauvegarde/restauration de l’espace scolaire.
- Palette d’actions avec Ctrl+/ ou Cmd+/.
- Cache hors ligne actualisé.

## Données et compatibilité
- Les ajouts personnels sont stockés dans `D.c3` ou `D.pro`, donc dans le document chiffré de Carnet.
- La sauvegarde/restauration proposée dans Paramètres concerne uniquement `D.c3` et `D.pro` : elle ne remplace pas les pages de « Mon carnet ».
- Pawnote, la connexion ENT HDF, le relais et le bundle Pawnote existants ne sont pas remplacés.
- Les cours Pronote, notes et devoirs restent dépendants des données que Pronote / Pawnote fournit réellement.
- Les notifications de navigateur et rappels locaux ne sont pas garantis si le navigateur ferme complètement le site.

## Installation
1. Sauvegarder le dépôt GitHub.
2. Décompresser l’archive.
3. Remplacer le contenu du dossier `Carnet` dans le dépôt par le contenu de ce dossier.
4. Ne pas remplacer le Worker / relais externe.
5. Publier puis recharger le site avec un rechargement forcé.

La syntaxe JavaScript et l’intégrité de l’archive ont été vérifiées. Un test réel avec un compte ENT HDF et le dépôt privé doit encore être réalisé.
