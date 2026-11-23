# Connexion directe à Pronote (comme Papillon)

Ton carnet peut lire Pronote avec ton compte : emploi du temps, devoirs, notes et moyennes.
Il faut **3 étapes, une seule fois** : un petit relais gratuit, la bibliothèque Pawnote, puis la connexion.

> **Pourquoi un relais ?** Le navigateur n'a pas le droit d'appeler Pronote depuis un autre site.
> Papillon n'a pas ce problème car c'est une application installée. Pour un site, un relais est nécessaire :
> c'est **ton** relais, sur **ton** compte gratuit, et il ne parle qu'à ton site et qu'à Pronote.

---

## Étape 1 — Le relais (Cloudflare, gratuit, ~5 min)

1. Crée un compte gratuit sur **cloudflare.com**, puis va dans **Workers & Pages → Create → Create Worker**. Donne-lui un nom (ex. `carnet-relais`) et valide « Deploy ».
2. Clique **Edit code**, efface tout, colle le contenu de **`relay/worker.js`**, puis **Deploy**.
3. Va dans **Settings → Variables and Secrets** et ajoute :
   | Nom | Type | Valeur |
   |---|---|---|
   | `ALLOWED_ORIGIN` | Texte | l'adresse de ton site, **sans `/` final** : `https://monpseudo.github.io` |
   | `RELAY_KEY` | **Secret** | une clé de ton choix, longue et au hasard (24 caractères ou plus) |
   | `ALLOWED_HOSTS` | Texte | *(facultatif)* le domaine de ton Pronote s'il n'est pas en `*.index-education.net` |
4. Note l'adresse du relais : `https://carnet-relais.TON-COMPTE.workers.dev`.
   Si tu l'ouvres dans un onglet, tu dois voir `{"error":"Origine non autorisée."}` : c'est **normal** (il ne répond qu'à ton site).

## Étape 2 — La bibliothèque Pawnote (sur ton ordinateur, ~2 min)

Il faut **Node.js 20 ou plus** (nodejs.org).

```bash
cd pawnote-build
npm install
npm run build
```

Cela crée et corrige automatiquement **`Carnet/js/vendor/pawnote.bundle.js`**. C’est le fichier réellement chargé par ton site GitHub Pages : envoie-le dans le dossier `js/vendor/` de ton dépôt.
(Ne mets pas le dossier `node_modules` sur GitHub.)

> **Licence** : Pawnote est sous **GPL-3.0**. Comme ton site est public, ajoute un fichier `LICENSE` (texte de la GPL-3.0, sur gnu.org) à ton dépôt, et laisse le code de ton site visible.

## Étape 3 — Connexion dans le carnet

### Cas n°1 — Ton compte passe par l'ENT (Édifice, etc.) : connexion par QR code

Avec un ENT, on ne tape pas de mot de passe Pronote : on utilise le **QR code de l'application mobile Pronote**, comme le fait Papillon.

1. Sur **ordinateur**, connecte-toi à Pronote **par ton ENT**.
2. Ouvre les paramètres de ton compte (ton nom en haut à droite → **Mon compte**, ou la rubrique **Mes données**), cherche **Application mobile** / **Connexion mobile**, puis **Générer le QR code**. L'emplacement varie un peu selon l'établissement. Si l'option n'existe pas, ton établissement n'autorise pas l'accès mobile.
3. Pronote te demande un **code à 4 chiffres** : choisis-le et retiens-le.
4. Dans le carnet : **🎓 → ⚙ Réglages → onglet « 🔐 ENT (code QR) »**, puis :
   - **🖼 Choisir une capture du QR code** (fais une capture d'écran du QR code et choisis-la), ou **📷 Scanner avec la caméra** (utile si le QR est sur l'écran de l'ordinateur et le carnet sur ton téléphone), ou colle le contenu du QR code (un petit texte `{"jeton":…}`) dans la zone prévue ;
   - saisis le **code à 4 chiffres**, l'**adresse** et la **clé du relais** ;
   - clique **Se connecter avec le QR code**.
5. ⚠ Le QR code n'est valable que **10 minutes** et **une seule fois**. En cas d'échec, génère-en un nouveau.

Ensuite, l'app garde un **jeton** (chiffré, sur cet appareil) : tu n'as plus besoin du QR code. Sur un autre appareil, génère un nouveau QR code.

### Cas n°2 — Ton compte se connecte sans ENT : identifiants Pronote

1. Ouvre le carnet → bouton **🎓** → onglet **⚙ Réglages** → bloc « Connexion directe à Pronote » → onglet **🔑 Identifiants Pronote**.
2. Renseigne :
   - **Adresse de ton Pronote** : celle que tu utilises dans le navigateur, jusqu'à `/pronote` (ex. `https://0123456a.index-education.net/pronote`),
   - **Identifiant** et **mot de passe** Pronote,
   - **Adresse du relais** et **clé du relais** (étape 1).
3. Clique **Tester le relais** → tu dois lire « ✓ Le relais fonctionne ».
4. Clique **🧪 Essayer avec la démo** : l'app se connecte au serveur de démonstration d'Index Éducation (aucun risque pour ton compte). C'est le meilleur moyen de vérifier que tout marche.
5. Clique **Se connecter** avec ton compte. Ton mot de passe n'est **jamais enregistré** ; l'app garde un jeton chiffré **sur cet appareil**.

Ensuite, l'onglet 🎓 se met à jour tout seul à l'ouverture (toutes les 20 minutes au plus), et avec **↻ Actualiser**.
Sur un autre appareil (téléphone, ordinateur) : retourne dans Réglages et clique « Se connecter » une fois (les données, elles, sont déjà synchronisées).

---

## Compatibilité PRONOTE 2026.2.5

Le script de compilation applique aussi un correctif ciblé pour les serveurs qui renvoient le challenge d’authentification non chiffré (PRONOTE 2026.2.5 et versions compatibles). Il ne modifie pas le déchiffrement du QR code lui-même.

## Si ça ne marche pas

Clique **Diagnostic → Copier le diagnostic** (Réglages) et envoie-le moi : il montre ce que la bibliothèque renvoie vraiment.

| Symptôme | Cause probable |
|---|---|
| « Relais injoignable ou bloqué » | adresse du relais fausse, ou `ALLOWED_ORIGIN` ne correspond pas exactement à l'adresse de ton site |
| « Relais : Clé du relais incorrecte » | la clé saisie n'est pas celle du secret `RELAY_KEY` |
| « Relais : Domaine non autorisé » | ton Pronote n'est pas en `*.index-education.net` : ajoute son domaine dans `ALLOWED_HOSTS` |
| « Bibliothèque Pawnote absente » | étape 2 non faite, ou fichier non envoyé sur GitHub |
| Connexion refusée | identifiant ou mot de passe faux, **compte ENT utilisé avec le mauvais onglet** (utilise « ENT (code QR) »), QR code périmé ou déjà utilisé, mauvais code à 4 chiffres, ou l'établissement n'autorise pas l'accès mobile |
| « QR code non détecté » | recadre la capture sur le QR code, ou colle son contenu dans la zone de texte ; le lecteur de QR est dans `pawnote.bundle.js` (étape 2) |
| Cours lus mais pas de notes ou de devoirs | les noms de champs de la bibliothèque diffèrent de ceux prévus : envoie-moi le diagnostic |

## Ce qui est stocké, et où

| Donnée | Où | Protection |
|---|---|---|
| Mot de passe Pronote | **nulle part** | saisi une fois puis effacé |
| Jeton Pronote | cet appareil seulement | chiffré avec ton mot de passe du carnet |
| Cours, devoirs, notes, moyennes | dans ton carnet, synchronisé via GitHub | chiffrés comme tes notes |
| Clé du relais, adresses | dans ton carnet (synchronisé) | chiffrés |

## À savoir

- Pawnote est une bibliothèque **non officielle** : Pronote peut la faire casser à tout moment, et ton établissement peut ne pas autoriser ce type d'accès.
- Le relais ne garde rien : il transmet les requêtes. Il ne répond qu'à ton site, avec ta clé, et seulement vers Pronote.
- Les cours des 2 dernières semaines et des 5 semaines à venir sont lus. Les notes de toutes les périodes sont lues.
