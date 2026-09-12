#!/usr/bin/env bash

set -e

echo "======================================"
echo "   Budget & Projets - Mise à jour"
echo "======================================"

# Toujours travailler depuis le dossier du script
cd "$(dirname "$0")"

# Message du commit
MESSAGE="${1:-Mise à jour Budget & Projets}"

# --------------------------------------
# 1. Nouvelle version du cache PWA
# --------------------------------------

CACHE_VERSION="budget-projets-pwa-$(date +%Y%m%d%H%M%S)"

if [ -f "www/service-worker.js" ]; then
    sed -i \
      "s/const CACHE = \".*\";/const CACHE = \"$CACHE_VERSION\";/" \
      www/service-worker.js

    echo "✓ Cache PWA : $CACHE_VERSION"
fi

# --------------------------------------
# 2. Synchroniser WWW vers le site web
# --------------------------------------

echo "→ Synchronisation de la version web..."

cp www/index.html ./index.html
cp www/manifest.webmanifest ./manifest.webmanifest
cp www/service-worker.js ./service-worker.js

rm -rf css js icons

cp -r www/css ./css
cp -r www/js ./js
cp -r www/icons ./icons

echo "✓ Version web synchronisée"

# --------------------------------------
# 3. Envoyer sur GitHub
# --------------------------------------

echo "→ Mise à jour GitHub..."

git add .

if git diff --cached --quiet
then
    echo "✓ Aucun nouveau changement Git à envoyer"
else
    git commit -m "$MESSAGE"
    git push
    echo "✓ GitHub Pages sera mis à jour"
fi

# --------------------------------------
# 4. Synchroniser Capacitor Android
# --------------------------------------

echo "→ Synchronisation Android..."

npx cap sync android

echo "✓ Projet Android synchronisé"

# --------------------------------------
# 5. Générer automatiquement l'APK
# --------------------------------------

echo "→ Compilation de l'APK..."

cd android
./gradlew assembleDebug
cd ..

echo ""
echo "======================================"
echo "       MISE À JOUR TERMINÉE"
echo "======================================"
echo ""
echo "Web :"
echo "https://botofotseld.github.io/budget-projets/"
echo ""
echo "APK :"
echo "$(pwd)/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
