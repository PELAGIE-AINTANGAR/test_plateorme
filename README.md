🎮 Motus – Jeu en ligne (Wordle-like)
Description

Projet de test technique : développement d’un jeu Motus en full-stack.
Le joueur doit deviner un mot secret en 6 essais maximum.
Chaque essai révèle des indices :

🟥 Carré rouge → lettre bien placée

🟡 Cercle jaune → lettre présente mais mal placée

🟦 Fond bleu → lettre absente

Fonctionnalités principales :

Authentification (création de compte & connexion)

Gestion de parties (difficultés, 6 tentatives, première lettre révélée)

Classement des joueurs (points calculés selon la difficulté, le nombre d’essais et la durée)

Interface responsive avec Next.js & Tailwind

Pile technique

Backend

Node.js
 + Fastify
 (API REST)

Prisma
 (ORM)

SQLite
 (par défaut, simple à lancer)

JWT
 + bcrypt
 pour la sécurité

Zod
 pour la validation des inputs

API de mots : Random Words API (FR)

Frontend

Next.js
 14 (App Router)

React
 18

Tailwind CSS
 pour le design

Stockage du token JWT dans localStorage

Installation et lancement
1. Cloner le projet
git clone https://github.com/<ton-compte>/<ton-repo>.git
cd motus

2. Lancer le backend
cd api
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev


L’API démarre sur http://localhost:4000
Test rapide : http://localhost:4000/health
 → {"ok":true}

3. Lancer le frontend
cd ../web
npm install
# (Windows PowerShell)
$env:NEXT_PUBLIC_API_BASE="http://localhost:4000"
npm run dev


Frontend dispo sur http://localhost:3000


Règles du jeu

Connectez-vous ou créez un compte.

Cliquez sur Nouvelle partie et choisissez la difficulté :

Facile : 4–5 lettres

Moyen : 6–7 lettres

Difficile : 8–12 lettres

Devinez le mot en 6 essais maximum.

La première lettre est révélée.

Chaque proposition doit avoir la même longueur que le mot secret.

Gagnez des points selon la difficulté, le nombre d’essais utilisés et la durée de la partie.

Consultez le classement via le lien “Voir le classement”.

Exemple de feedback

Mot secret : PARIS
Essai : PLAGE

Résultat :

P → 🟥 (bien placé)

L → 🟦 (absent)

A → 🟥 (bien placé)

G → 🟦 (absent)

E → 🟦 (absent)


Authentification

Un compte est requis pour jouer.

Mot de passe : minimum 8 caractères.

Les tokens JWT sont stockés côté client dans localStorage.


Classement

Calcul du score :

Base selon la difficulté :

Facile = 50 points

Moyen = 100 points

Difficile = 150 points

Bonus : 10 × (6 − tentatives utilisées)

Pénalité : 1 point toutes les 15s de partie

📂 Arborescence
motus/
├── api/          # Backend Fastify + Prisma
│   ├── src/
│   ├── prisma/
│   └── package.json
├── web/          # Frontend Next.js + Tailwind
│   ├── app/
│   └── package.json
└── README.md

Améliorations possibles

Ajout d’une documentation Swagger (OpenAPI)

Ajout de tests automatiques (Jest / Playwright)

Passage à PostgreSQL avec Docker Compose pour supporter les enums natifs

Déploiement (API → Render/Railway, Front → Vercel/Netlify)