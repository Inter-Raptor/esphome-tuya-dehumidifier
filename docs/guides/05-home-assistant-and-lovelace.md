# 05 — Home Assistant et Lovelace

## Fichiers fournis

- Dashboard exemple : `configs/lovelace/lovelace-demo.yaml`
- Carte custom : `configs/lovelace/raptor-dehumidifier-card.js`

## Organisation conseillée

Créer une vue en 3 sections :

1. Pilotage rapide
2. Réglages
3. Diagnostic

Cette structure rend la page plus lisible au quotidien.

## Bonnes pratiques UX

- Une carte principale visible en premier écran.
- Regrouper les réglages avancés dans une carte entities dédiée.
- Garder les capteurs techniques dans un bloc séparé (debug).
