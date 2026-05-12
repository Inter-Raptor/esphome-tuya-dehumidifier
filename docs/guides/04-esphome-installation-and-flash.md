# 04 — Installation ESPHome et flash

## Installer ESPHome

```powershell
python -m pip install --upgrade esphome
esphome version
```

## Préparer la configuration

Fichier principal : `configs/esphome/deshumidificateur.yaml`

Modifie au minimum :

- SSID Wi-Fi
- mot de passe Wi-Fi
- API/OTA password si activés

## Premier flash USB

```powershell
esphome run "C:\Path\To\deshumidificateur.yaml" --device COM5
```

## Flash OTA ensuite

```powershell
esphome run "C:\Path\To\deshumidificateur.yaml" --device 192.168.1.XX
```
