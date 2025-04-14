#!/bin/bash

# Stop on error
set -e

# Nom du dépôt GitHub
REPO="GitHub-Release-Tracker"
USERNAME="nexgen999"

echo "🧼 Nettoyage du build précédent..."
rm -rf out

echo "📦 Installation des dépendances..."
pnpm install

echo "🔨 Build de l'application..."
pnpm build

echo "📤 Export statique..."
pnpm export

cd out

echo "🚀 Déploiement sur gh-pages..."

git init
git add .
git commit -m "Deploy to GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/$USERNAME/$REPO.git
git push -f origin gh-pages

cd ..

echo "✅ Déploiement terminé !"
echo "🌐 Accède à ton site : https://$USERNAME.github.io/$REPO/"
