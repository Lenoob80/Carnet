# Carnet 3.0

## Installation GitHub Pages
1. Faire une sauvegarde/export de tes données avant remplacement.
2. Décompresser l'archive.
3. Envoyer le contenu du dossier `Carnet` à la racine du dépôt GitHub Pages en conservant les sous-dossiers.
4. Attendre le déploiement puis recharger le site avec Ctrl+F5.

## Conservé
- Connexion Pronote par QR ENT et Pawnote embarqué.
- Configuration et code du relais existant (aucune URL/clé secrète n'est incluse dans le dépôt public).
- Agenda, devoirs, notes, carnet de pages, tableaux, outils, sauvegarde GitHub chiffrée et PWA.

## Ajouts 3.0
- Navigation latérale unifiée, adaptée au mobile.
- Thème clair, sombre ou système.
- Fiches de cours personnelles par matière.
- Bibliothèque de documents (limite 2 Mo par fichier, stockés dans les données chiffrées du carnet).
- Statistiques scolaires.
- Simulateur de prochaine note.
- Historique de notifications de nouvelles notes/devoirs, avec notifications navigateur si autorisées.
- Ajout de `D.c3` au document chiffré et au cache local pour synchroniser les fiches, documents et alertes entre appareils.

## Limites à connaître
- Les notifications sont détectées lors des synchronisations / contrôles tant que l'application est ouverte. Les notifications push quand le site est fermé nécessitent un serveur push dédié.
- Le mode hors ligne permet de rouvrir les fichiers déjà mis en cache et les données déjà enregistrées sur l'appareil. La connexion et les nouvelles données Pronote nécessitent Internet.
- Les documents sont limités à 2 Mo chacun pour éviter de rendre la sauvegarde chiffrée trop volumineuse.
- Le simulateur est indicatif et ne remplace pas les règles officielles de calcul de Pronote.
