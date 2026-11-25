# Carnet 4.0.2 — widgets, dernières notes et compétences

## Correctifs et ajouts
- Réparation de la personnalisation des widgets : les cases ciblent désormais le bon identifiant, l’affichage se met à jour et le panneau reste ouvert pendant les réglages.
- Ajout de « Dernières notes » dans Notes & résultats, triées de la plus récente à la plus ancienne, avec matière, date, note, barème et origine.
- Ajout de la rubrique « Compétences » : création de compétences personnelles par matière, niveau de maîtrise, date, commentaire, modification du niveau et suppression.
- Les compétences sont enregistrées dans `D.c3.skills`, inclus dans la sauvegarde scolaire existante.
- Migration unique de navigation pour rendre la nouvelle rubrique Compétences visible sur les installations existantes.
- Version du cache Service Worker incrémentée pour éviter de conserver les anciens fichiers.

## Limites importantes
Les compétences sont personnelles/manuelles. L’archive ne prétend pas importer des compétences depuis Pronote : cela dépend des données effectivement exposées par l’ENT et Pawnote pour l’établissement.

## Vérifications
La syntaxe JavaScript des fichiers du site, du build Pawnote et du relais est vérifiée avec `node --check`. L’archive ZIP est testée. Une connexion réelle ENT HDF et les données du compte ne peuvent être testées ici.
