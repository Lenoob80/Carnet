# Carnet 4.0.6 — restauration du thème et correctif Compétences

## Navigation et thème
- Le raccourci Paramètres redondant dans le bas de la barre latérale est retiré.
- Le bouton de thème est conservé/restauré à cet emplacement : il alterne Système, Sombre et Clair.
- Le réglage complet du thème reste disponible dans Paramètres > Apparence.
- Le bouton Paramètres principal dans la navigation reste disponible.

## Compétences Pronote
- Sélection explicite des ressources Pawnote via `Pawnote.use(session, resource)`.
- Recherche des périodes dans l'onglet Évaluations (TabLocation.Evaluations) de chaque ressource.
- Requête `Pawnote.evaluations(session, period)` pour chaque période trouvée.
- Diagnostic enrichi (ressources, onglets, périodes, évaluations et compétences retournées).
- En cas d'échec des requêtes, les anciennes données de compétences ne sont pas écrasées.

## Validation
- Vérification syntaxique des scripts JavaScript avec Node.js.
- Vérification de présence des scripts et du bundle Pawnote 1.6.4.
- Le contenu réel des évaluations reste à valider après connexion au compte ENT HDF : aucune session Pronote de l'utilisateur n'est accessible lors de la préparation de cette archive.
