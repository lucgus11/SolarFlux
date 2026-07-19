# 🌞 SolarFlux

PWA Zen/Fintech pour harmoniser votre consommation d'énergie et d'eau avec votre production solaire, en temps réel, à partir de vos appareils **HomeWizard** (réseau local) et de la météo **Open-Meteo** (gratuite, sans clé).

---

## 📁 Architecture du projet

```
solarflux/
├── index.html              # Page principale (dashboard)
├── manifest.json            # Manifest PWA (icônes, nom, couleurs)
├── service-worker.js        # Cache offline + gestion des notifications
├── vercel.json               # Config de déploiement Vercel
├── .gitignore
├── css/
│   └── style.css             # Design glassmorphism / dark mode / aura dynamique
├── js/
│   ├── app.js                 # Orchestration principale (boucle de rafraîchissement, Zen-Score, aura)
│   ├── homewizard.js          # Appels API locaux vers P1 / Energy Sockets / Watermeter
│   ├── weather.js             # Appels Open-Meteo + logique de conseil ("pic solaire")
│   ├── charts.js              # Mini-graphique canvas de tendance journalière
│   ├── particles.js           # Animation de particules lumineuses en arrière-plan
│   └── settings.js            # Panneau de paramètres + stockage localStorage
└── icons/
    ├── icon-192.svg
    ├── icon-512.svg
    └── icon-maskable.svg
```

Aucun framework, aucune dépendance à installer : c'est du HTML/CSS/JS natif, directement déployable.

---

## 🔑 À propos des "clés API" — ce qu'il faut vraiment configurer

**Il n'y a pas de clé API secrète à obtenir.** Les deux services utilisés sont :

### 1. HomeWizard (local, sans authentification par clé)
Les appareils HomeWizard récents (API v1) exposent une API HTTP **non authentifiée** sur votre réseau local (ex: `http://192.168.1.20/api/v1/data`). Il n'y a donc pas de clé à générer — il suffit de connaître **l'adresse IP locale** de chaque appareil :

- Ouvrez l'app HomeWizard Energy sur votre téléphone
- Allez dans les paramètres de chaque appareil (P1, Energy Socket, Watermeter)
- Notez son adresse IP locale (ou fixez-la dans votre routeur pour qu'elle ne change jamais)
- Renseignez ces IP dans le panneau **⚙ Paramètres** de SolarFlux

> ⚠️ Certains anciens firmwares HomeWizard nécessitent d'activer l'« API locale » dans les paramètres de l'appareil (menu *Paramètres > API locale*).

### 2. Open-Meteo (météo, 100% gratuit, sans clé)
Aucune inscription requise. Il suffit de renseigner votre **latitude/longitude** dans les paramètres (vous pouvez les récupérer via Google Maps : clic droit sur votre position → les coordonnées s'affichent).

### Stockage des paramètres
Toutes ces informations (IP des appareils, position, tarifs €/kWh) sont enregistrées uniquement dans le **localStorage** du navigateur — rien n'est envoyé à un serveur externe, rien n'est stocké dans le code ou sur GitHub.

---

## ⚠️ Point d'attention technique : HTTPS vs HTTP local

Vercel sert votre site en **HTTPS**. Les appareils HomeWizard répondent en **HTTP** simple sur le réseau local. Les navigateurs modernes bloquent souvent les requêtes "mixed content" (HTTPS → HTTP).

Solutions possibles :
1. **Usage recommandé** : ouvrez SolarFlux depuis un navigateur configuré pour autoriser le contenu mixte pour ce site (Chrome : icône de cadenas → Paramètres du site → Contenu non sécurisé → Autoriser), en étant sur le même réseau Wi-Fi que vos appareils.
2. **Alternative robuste** : utilisez la [HomeWizard Local API via un petit proxy local](https://api-documentation.homewizard.com/) (ex: un script Node/Python tournant sur votre réseau local qui relaie les données en HTTPS auto-signé, ou un reverse proxy comme Caddy).
3. Certains utilisateurs installent SolarFlux via un serveur local (Raspberry Pi, NAS) plutôt que Vercel, pour rester en HTTP de bout en bout sur le LAN.

Le code est prêt pour les trois cas — seule l'URL de base de vos appareils change dans les paramètres.

---

## 🚀 Déploiement

### GitHub
```bash
git init
git add .
git commit -m "Initial commit — SolarFlux PWA"
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/solarflux.git
git push -u origin main
```

### Vercel
1. Allez sur [vercel.com](https://vercel.com) → **New Project**
2. Importez votre dépôt GitHub `solarflux`
3. Framework preset : **Other** (site statique, aucune commande de build nécessaire)
4. Cliquez sur **Deploy**

C'est tout : aucune variable d'environnement n'est nécessaire côté Vercel, puisque toute la configuration (IP, position, tarifs) est saisie et stockée côté client par chaque utilisateur.

---

## 🔔 Notifications

Les notifications sont **locales** (via l'API `Notification` du navigateur), déclenchées quand :
- Le pic d'ensoleillement de l'heure en cours dépasse un seuil de radiation solaire (>400 W/m²)

Activez-les depuis **⚙ Paramètres → Activer les notifications**.

> Remarque : les navigateurs limitent l'exécution en arrière-plan des PWA. Les notifications sont vérifiées tant que l'app est ouverte (ou installée et active) ; il ne s'agit pas d'un vrai push serveur, puisque tout reste local par design.

---

## 🎨 Fonctionnalités

- **Compteur central** : solde temps réel (gain doré/vert ou coût bleu/violet)
- **Zen-Score** : score d'éco-responsabilité sur 100, anneau animé
- **Jauge d'eau** : goutte SVG qui se remplit selon la consommation du jour
- **Prévisions solaires** : 6 prochaines heures via Open-Meteo, avec conseil textuel
- **Historique** : mini-graphique canvas (jaune = positif, bleu = négatif)
- **Aura dynamique** : dégradé d'arrière-plan + particules lumineuses réactives à l'état de la maison
- **PWA installable** : manifest + service worker (cache offline des assets statiques)

---

## 🛠️ Développement local

Aucun build nécessaire. Servez simplement le dossier avec n'importe quel serveur statique, par exemple :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080` (idéalement depuis un appareil sur le même réseau que vos appareils HomeWizard).
