# Carnet 4.0.4 — correctif Évaluations Pronote et navigation

- Récupération des périodes propres à l’onglet Évaluations via `session.userResource.tabs.get(Pawnote.TabLocation.Evaluations)`, avec solution de repli sur les périodes générales.
- Diagnostic enrichi : onglets accessibles, périodes interrogées et nombre d’évaluations retournées par période.
- Masquage de la barre d’onglets Pronote lorsque l’écran Réglages est ouvert.
- Suppression du raccourci « Système » en bas de la barre latérale ; le choix du thème reste dans Paramètres > Apparence.
- Version du cache Service Worker incrémentée pour charger les fichiers mis à jour.

La récupération effective dépend toujours des évaluations publiées par l’établissement et des autorisations de la session élève. Après déploiement, lancer une synchronisation Pronote et consulter le diagnostic si aucune évaluation n’apparaît.
