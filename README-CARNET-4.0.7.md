# Carnet 4.0.7 — correctif authentification Pronote

## Correctif principal
- Le bundle 4.0.6 contenait Pawnote 1.6.2 alors que le projet attendait Pawnote 1.6.4.
- Le calcul de challenge de l'ancien bundle a été remplacé par l'algorithme AES-CBC à clé et IV dérivés par MD5 utilisé par Pawnote LTS 1.6.4.
- Le calcul de clé utilise le nom d'utilisateur normalisé en minuscules, conformément à la version LTS.
- Le jeton `loginTokenSAV` est transmis lors du renouvellement d'une session.
- Le service worker reçoit une nouvelle version de cache pour forcer le téléchargement du bundle corrigé.

## Fichiers conservés
Les pages, notes, devoirs, compétences, paramètres, thèmes, données locales et le relais Cloudflare restent dans l'archive. Le relais n'a pas été modifié.

## Déploiement
Publier le contenu du dossier `Carnet/` sur le dépôt GitHub Pages en remplaçant les fichiers du site. Ne pas supprimer les données du navigateur ni réinitialiser le stockage local.

Pour reconstruire le bundle, utiliser le dossier `pawnote-build/` fourni à côté de `Carnet/` : `npm install`, puis `npm run build`.

## Limite de validation
Le bundle et les scripts ont été vérifiés statiquement. La connexion finale doit être validée sur le compte ENT HDF réel ; aucune session, aucun mot de passe et aucun QR personnel ne sont présents dans cette archive.
