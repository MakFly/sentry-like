# Migration Guide: Séparation des Repos SDKs

## Overview

Ce document guide la migration des SDKs depuis le repo monorepo principal vers un repo dédié.

## Nouvelle Structure

### Avant
```
sentry-like/
├── apps/
│   ├── dashboard/
│   └── monitoring-server/
├── packages/                    # ❌ À supprimer
│   ├── errorwatch-sdk/
│   └── errorwatch-sdk-symfony/
├── examples/
└── example-client/
```

### Après
```
┌─────────────────────────────────────┐
│ errorwatch/ (repo principal)        │
├─────────────────────────────────────┤
│ apps/                               │
│ ├── dashboard/                      │
│ └── monitoring-server/              │
│ examples/                           │
│ └── (utilisent @errorwatch/sdk)     │
└── example-client/                   │
    └── (utilise errorwatch/sdk)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ errorwatch-sdks/ (nouveau repo)     │
├─────────────────────────────────────┤
│ packages/                           │
│ ├── sdk/ → @errorwatch/sdk          │
│ └── sdk-symfony/ → errorwatch/sdk   │
└─────────────────────────────────────┘
```

## Étapes de Migration

### Étape 1: Créer le nouveau repo SDKs

```bash
# Le nouveau repo existe déjà à:
# /home/kev/Documents/lab/sites/saas/errorwatch-sdks
```

**Actions requises:**
1. Créer un nouveau repo GitHub: `https://github.com/your-org/errorwatch-sdks`
2. Initialiser git dans le dossier local
3. Pusher vers GitHub

```bash
cd /home/kev/Documents/lab/sites/saas/errorwatch-sdks
git init
git add .
git commit -m "Initial commit: ErrorWatch SDKs monorepo"

git remote add origin https://github.com/your-org/errorwatch-sdks.git
git branch -M main
git push -u origin main
```

### Étape 2: Supprimer les packages du repo principal

```bash
cd /home/kev/Documents/lab/sites/saas/sentry-like
rm -rf packages/
```

### Étape 3: Mettre à jour le README du repo principal

Le README de `sentry-like` doit refléter la nouvelle structure :

```diff
- ErrorWatch - Self-hosted error monitoring SaaS
+ ErrorWatch Platform - Self-hosted error monitoring infrastructure

## Quick Start

1. **Clone the main repo:**
   ```bash
   git clone https://github.com/your-org/errorwatch.git
   cd errorwatch
   ```

2. **Install and start:**
   ```bash
   make install
   make dev
   ```

## Repositories

| Repo | Description | URL |
|------|-------------|-----|
| `errorwatch` | Main platform (Dashboard + API) | [github.com/your-org/errorwatch](https://github.com/your-org/errorwatch) |
| `errorwatch-sdks` | Client SDKs | [github.com/your-org/errorwatch-sdks](https://github.com/your-org/errorwatch-sdks) |

## SDKs Installation

The SDKs are published as separate packages:

```bash
# JavaScript/TypeScript
npm install @errorwatch/sdk

# PHP/Symfony
composer require errorwatch/sdk-symfony
```

See [errorwatch-sdks](https://github.com/your-org/errorwatch-sdks) for SDK documentation.
```

### Étape 4: Mettre à jour CLAUDE.md

Supprimer la section "Project Structure" qui référençait `packages/`.

```diff
├── packages/
- │   ├── errorwatch-sdk/
- │   └── errorwatch-sdk-symfony/
```

Ajouter une référence au repo SDKs :

```diff
## Documentation

+ **SDKs**: See [errorwatch-sdks](https://github.com/your-org/errorwatch-sdks) repository
```

### Étape 5: Publier les packages (optionnel pour le moment)

**Pour npm (@errorwatch/sdk):**

```bash
cd /home/kev/Documents/lab/sites/saas/errorwatch-sdks/packages/sdk
npm publish
```

**Pour Packagist (errorwatch/sdk-symfony):**

1. Connecter à [Packagist](https://packagist.org/)
2. Lier le repo GitHub
3. Le package sera auto-publié

### Étape 6: Mettre à jour les liens de dépendance

Dans les examples et example-client, les dépendances sont déjà mises à jour vers les versions publiées :

```json
{
  "dependencies": {
    "@errorwatch/sdk": "^1.0.0"  // ✅ Déjà mis à jour
  }
}
```

## Checklist de Migration

- [ ] Créer le repo GitHub `errorwatch-sdks`
- [ ] Pusher le code vers GitHub
- [ ] Supprimer le dossier `packages/` du repo principal
- [ ] Mettre à jour README.md du repo principal
- [ ] Mettre à jour CLAUDE.md du repo principal
- [ ] Publier `@errorwatch/sdk` sur npm (optionnel)
- [ ] Publier `errorwatch/sdk-symfony` sur Packagist (optionnel)
- [ ] Tester les examples avec les packages publiés
- [ ] Mettre à jour la documentation

## Avantages de la Séparation

| Avant | Après |
|-------|-------|
| 1 repo monolithique | 2 repos spécialisés |
| Release couplée (apps + SDKs) | Release indépendante |
| Version unique pour tous | Versioning séparé |
 | Changesets pour versioning automatique | |
| CI/CD commun | CI/CD spécifique par repo |

## Workflow de Développement

### Développer un SDK

1. Aller dans `errorwatch-sdks`
2. Faire les modifications
3. Créer un changeset: `bun run changeset`
4. PR + Merge
5. Release: `bun run release` (publie sur npm/Packagist)

### Mettre à jour le repo principal

1. Mettre à jour les dépendances dans `examples/` pour tester
2. Tester les nouveaux SDKs
3. Mettre à jour la documentation

## Questions Fréquentes

**Q: Pourquoi séparer les repos ?**

R:
- Versioning indépendant (SDKs et apps évoluent à des rythmes différents)
- Releases plus fréquentes des SDKs sans toucher à la platforme
- CI/CD plus simple (tests, builds, déploiement spécifiques)
- Meilleure découverture pour les utilisateurs (les SDKs sont des produits distincts)

**Q: Comment tester les modifications locales d'un SDK ?**

R: Utiliser `npm link` ou `npm install file:`:

```bash
cd errorwatch-sdks/packages/sdk
bun run build
npm link

cd errorwatch/examples/react-vite
npm link @errorwatch/sdk
```

**Q: Est-ce que les examples sont toujours utiles ?**

R: Oui! Ils servent à:
- Tester les SDKs en développement
- Documentation vivante pour les utilisateurs
- Tests d'intégration (CI)

## Contact

Pour toute question sur cette migration, contactez l'équipe ErrorWatch.
