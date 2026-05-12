# 01 — Introduction

## Objectif

Ce projet permet de piloter localement un déshumidificateur Pro Breeze PB-D-27-EU en contournant la dépendance cloud Tuya.

## Ce que tu obtiens

- Contrôle ON/OFF
- Réglage humidité cible
- Gestion modes de fonctionnement
- Intégration Home Assistant
- Dashboard Lovelace personnalisable

## Peut fonctionner avec d'autres modèles

Oui, c’est possible si l’appareil utilise une architecture similaire :

1. MCU Tuya (ou compatible) connecté en UART ;
2. datagrams Tuya standard ;
3. alimentation permettant d’ajouter un ESP en sécurité.

### Ce qu’il faudra adapter

- Mapping des datapoints (DP01, DP02, etc.)
- Vitesse UART et pins RX/TX
- Gestion logique des modes (certains modèles ont des modes propriétaires)

## Limites

- Projet orienté “maker”, pas produit certifié.
- Toute intervention annule potentiellement la garantie.
