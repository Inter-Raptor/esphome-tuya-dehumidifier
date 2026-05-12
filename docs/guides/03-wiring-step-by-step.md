# 03 — Câblage pas-à-pas

## Étape 1 — Identifier les points

Repère sur la carte :

- GND
- TX côté Tuya
- RX côté Tuya
- alimentation auxiliaire potentielle

Utilise les photos :

- `docs/assets/images/control-board-closeup.jpg`
- `docs/assets/images/esp32-connected-to-control-board.jpg`

## Étape 2 — Raccorder la masse

Toujours connecter **GND ESP32 ↔ GND carte** avant le reste.

## Étape 3 — Raccorder UART avec protection

Configuration type utilisée :

```yaml
uart:
  rx_pin: GPIO20
  tx_pin: GPIO21
  baud_rate: 9600
```

Raccordement :

- ESP TX (GPIO21) -> 1kΩ -> Tuya RX
- ESP RX (GPIO20) <- 1kΩ <- Tuya TX

## Étape 4 — Vérifier le niveau logique

Si Tuya TX est en 5V, ne branche pas directement sur ESP RX.

Utilise un diviseur ou level-shifter.

Exemple diviseur :

```text
Tuya TX --- 10 kΩ ---+--- ESP RX
                     |
                    20 kΩ
                     |
                    GND
```

## Étape 5 — Vérification électrique

Avant allumage :

- pas de court-circuit
- fils isolés
- polarités vérifiées
