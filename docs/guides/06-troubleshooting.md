# 06 — Dépannage

## L’ESP ne communique pas avec Tuya

Vérifier :

- TX/RX non inversés ?
- Masse commune présente ?
- Baudrate correct (9600 par défaut ici) ?

## Valeurs incohérentes

- Le mapping des datapoints peut être différent selon modèle.
- Logger UART/tuya pour confirmer les DPs réels.

## Home Assistant ne voit pas les entités

- Vérifier API ESPHome
- Vérifier IP de l’ESP
- Vérifier que le flash chargé est le bon fichier

## Bac plein / mode non conforme

- Certains modèles imposent des états de sécurité prioritaires.
- Tester manuellement chaque mode pour confirmer les contraintes firmware.
