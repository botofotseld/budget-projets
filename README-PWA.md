# Budget & Projets — PWA

Cette version est une Progressive Web App.

## Fonctionnalités
- Budget personnel
- Transactions
- Projets simples et détaillés
- Checklist mensuelle
- Dépenses projet
- Matériaux
- Ouvriers
- Étapes
- Sauvegarde JSON
- Installation comme application
- Cache hors ligne

## Important pour tester la PWA

Une PWA ne doit pas être ouverte directement avec `file://`.
Il faut lancer un petit serveur local.

Depuis le dossier :

```bash
python3 -m http.server 8080
```

Puis ouvrir :

http://localhost:8080

Dans Chrome/Chromium, un bouton **Installer** apparaîtra si les conditions d'installation sont remplies.

## Android

Cette base est prête pour l'étape suivante :
- Capacitor
- génération d'un projet Android
- APK/AAB
