# Carnet 4.0.3

## Correctifs
- Import des évaluations de compétences Pronote via `Pawnote.evaluations(session, period)` pour chaque période disponible.
- Affichage chronologique des évaluations et des compétences détaillées (intitulé, niveau, domaine, pilier).
- Conservation séparée des compétences personnelles déjà saisies.
- Correctif du panneau latéral interne en mode Concentration (bureau et mobile).
- Zoom du document Mon carnet : boutons − / pourcentage / +, Ctrl/Cmd + molette, Ctrl/Cmd + +/− et Ctrl/Cmd + 0. Plage : 50 à 200 %.
- Version du cache hors ligne incrémentée.

## Déploiement
Cette archive contient uniquement le dossier `Carnet/` prêt pour GitHub Pages. Le relais Cloudflare déjà déployé reste nécessaire à la connexion Pronote, mais son code source n'est pas inclus dans cette archive de déploiement. Le bundle Pawnote compilé reste présent dans `js/vendor/pawnote.bundle.js`; le dossier de construction `pawnote-build/` n'est pas nécessaire au fonctionnement courant du site.
