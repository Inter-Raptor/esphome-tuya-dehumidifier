# Pro Breeze PB-D-27-EU — ESPHome Tuya UART Hack

Local control of a **Pro Breeze PB-D-27-EU 12L compressor dehumidifier** using an **ESP32-C3**, **ESPHome**, **Tuya MCU UART**, and **Home Assistant**.

This project replaces or bypasses the original Tuya Wi-Fi module communication so the dehumidifier can be controlled locally without cloud dependency.

---

## ⚠️ Safety warning

This project requires opening a mains-powered 230 V appliance.

- Always unplug the appliance before working on it.
- Wait a few minutes after unplugging before touching the electronics.
- Do not touch the mains power section.
- This appliance uses **R290 refrigerant**, which is flammable.
- Do not drill, heat, pierce, or modify the refrigeration circuit.
- Do not publish your real Wi-Fi password, MQTT password, private keys, or personal IP layout.
- You are responsible for your own safety.

---

## Tested device

| Item | Value |
|---|---|
| Brand | Pro Breeze |
| Model | PB-D-27-EU |
| Type | 12L compressor dehumidifier |
| Power | 190 W |
| Voltage | 220–240 V AC |
| Frequency | 50 Hz |
| Water tank | 2 L |
| Weight | 7.6 kg |
| Operating temperature | 5–32 °C |
| Refrigerant | R290 / 31 g |
| Dehumidifying capacity | 12 L/day at 30 °C / 80 % RH |

---

## Features

- Local ESPHome control
- Home Assistant integration
- No MQTT required
- Auto mode
- Forced ON mode
- Forced OFF mode
- 1-hour boost mode
- Day humidity target
- Silent-period humidity target
- Configurable silent-period start/end hour
- Fan speed selection
- Tank-full detection
- Automatic control recovery if settings are changed directly on the appliance
- Optional custom Lovelace card

---

## Hardware required

- ESP32-C3 board
- Wires or Dupont cables
- 1 kΩ resistor for ESP TX line
- 1 kΩ resistor for ESP RX line
- Heat shrink tubing or insulation
- Multimeter
- USB cable for first flash
- Optional: logic level shifter if the Tuya UART signal is 5 V

---

## UART wiring

The dehumidifier uses a Tuya MCU UART interface.

Default ESPHome UART configuration used in this project:

```yaml
uart:
  rx_pin: GPIO20
  tx_pin: GPIO21
  baud_rate: 9600

tuya:
```

### Basic wiring

| ESP32-C3 | Dehumidifier / Tuya MCU | Notes |
|---|---|---|
| GND | GND | Common ground is required |
| GPIO21 TX | Tuya RX | Add 1 kΩ series resistor |
| GPIO20 RX | Tuya TX | Add 1 kΩ series resistor |
| VIN / 5V | 5 V supply if available and safe | Depends on your board |
| 3V3 | 3.3 V only if the board provides it safely | Do not feed 5 V into 3V3 |

Recommended UART protection:

```text
ESP GPIO21 TX --- 1 kΩ --- Tuya RX
ESP GPIO20 RX --- 1 kΩ --- Tuya TX
ESP GND ------------------ Tuya GND
```

### If Tuya TX is 5 V

The ESP32 GPIO is not 5 V tolerant. If the Tuya TX line is 5 V, use a level shifter or a voltage divider.

Example voltage divider:

```text
Tuya TX --- 10 kΩ ---+--- ESP RX GPIO20
                     |
                    20 kΩ
                     |
                    GND
```

---

## Known Tuya datapoints

| Datapoint | Function |
|---|---|
| DP01 | Power ON/OFF |
| DP02 | Humidity target |
| DP04 | Fan speed |
| DP05 | Device mode |
| DP06 | Current humidity |
| DP65 | Timer in hours |

### Values

```text
DP04 fan speed:
  0 = High
  1 = Low

DP05 device mode:
  0 = CO
  1 = AU
  2 = Humidity target mode
```

For this appliance, the humidity target is only properly applied when DP05 is set to humidity target mode.

---

## ESPHome YAML

Use the provided example file:

```text
deshumidificateur-example.yaml
```

Before flashing, edit the Wi-Fi section:

```yaml
wifi:
  ssid: "YOUR_WIFI_NAME"
  password: "YOUR_WIFI_PASSWORD"

  ap:
    ssid: "Dehumidifier_Fallback"
    password: "CHANGE_ME_123"
```

Do not commit real credentials to GitHub.

---

## Installing ESPHome from PowerShell

Open PowerShell and install ESPHome:

```powershell
python -m pip install --upgrade esphome
```

Check the installation:

```powershell
esphome version
```

---

## First flash over USB

Connect the ESP32-C3 to your PC.

Find the correct COM port, then run:

```powershell
esphome run "C:\Path\To\deshumidificateur-example.yaml" --device COM5
```

Replace `COM5` with your real port.

Example:

```powershell
esphome run "C:\Users\YourName\Desktop\deshumidificateur-example.yaml" --device COM5
```

---

## OTA update over Wi-Fi

After the first successful flash, you can update the ESP over Wi-Fi:

```powershell
esphome run "C:\Path\To\deshumidificateur-example.yaml" --device 192.168.1.XX
```

Replace `192.168.1.XX` with the ESP IP address.

---

## Viewing logs

```powershell
esphome logs "C:\Path\To\deshumidificateur-example.yaml" --device 192.168.1.XX
```

---

## Adding the ESPHome device to Home Assistant

1. Open Home Assistant.
2. Go to **Settings**.
3. Go to **Devices & services**.
4. Click **Add integration**.
5. Search for **ESPHome**.
6. Enter the ESP IP address.
7. Default ESPHome API port is usually `6053`.

If Home Assistant auto-discovers the ESPHome device, simply click **Configure**.

---

## Installing the custom Lovelace card

The custom card file should be named:

```text
raptor-dehumidifier-card.js
```

Copy it to your Home Assistant `www` folder:

```text
/config/www/raptor-dehumidifier-card.js
```

In Home Assistant, the public path becomes:

```text
/local/raptor-dehumidifier-card.js
```

### Add the resource in Home Assistant

Go to:

```text
Settings → Dashboards → Resources
```

Add a new JavaScript module:

```text
/local/raptor-dehumidifier-card.js
```

Resource type:

```text
JavaScript module
```

Then refresh the browser with `Ctrl + F5`.

---

## Lovelace card example

Example Lovelace YAML:

```yaml
type: grid
cards:
  - type: heading
    heading: Dehumidifier

  - type: custom:raptor-dehumidifier-card
    size: small
    background: light
    title: Dehumidifier
    entity_power: switch.deshumidificateur_marche_appareil
    entity_humidity: sensor.deshumidificateur_humidite_actuelle
    entity_target: text_sensor.deshumidificateur_cible_active
    entity_boost: button.deshumidificateur_boost_1h
    entity_stop_boost: button.deshumidificateur_stop_boost
    entity_boost_state: text_sensor.deshumidificateur_boost_etat
    entity_mode: select.deshumidificateur_mode_fonctionnement
    entity_tank_full: binary_sensor.deshumidificateur_bac_plein
    long_press_path: /config/devices/device/YOUR_DEVICE_ID

  - type: custom:raptor-dehumidifier-card
    size: medium
    background: dark
    title: Dehumidifier
    entity_power: switch.deshumidificateur_marche_appareil
    entity_humidity: sensor.deshumidificateur_humidite_actuelle
    entity_target: text_sensor.deshumidificateur_cible_active
    entity_boost: button.deshumidificateur_boost_1h
    entity_stop_boost: button.deshumidificateur_stop_boost
    entity_boost_state: text_sensor.deshumidificateur_boost_etat
    entity_mode: select.deshumidificateur_mode_fonctionnement
    entity_tank_full: binary_sensor.deshumidificateur_bac_plein
    long_press_path: /config/devices/device/YOUR_DEVICE_ID

  - type: custom:raptor-dehumidifier-card
    size: large
    background: glass
    title: Dehumidifier
    entity_power: switch.deshumidificateur_marche_appareil
    entity_humidity: sensor.deshumidificateur_humidite_actuelle
    entity_target: text_sensor.deshumidificateur_cible_active
    entity_boost: button.deshumidificateur_boost_1h
    entity_stop_boost: button.deshumidificateur_stop_boost
    entity_boost_state: text_sensor.deshumidificateur_boost_etat
    entity_mode: select.deshumidificateur_mode_fonctionnement
    entity_tank_full: binary_sensor.deshumidificateur_bac_plein
    long_press_path: /config/devices/device/YOUR_DEVICE_ID
```

Replace:

```text
YOUR_DEVICE_ID
```

with the Home Assistant device page ID if you want long press to open the device page.

---

## Custom card behavior

The custom Lovelace card supports three sizes:

| Size | Behavior |
|---|---|
| small | Compact icon tile |
| medium | Compact tile with mode buttons |
| large | Full card with gauge and controls |

### Click behavior

| Action | Result |
|---|---|
| Short click | Toggle boost ON/OFF |
| Long press | Open the Home Assistant device page |
| Mode button | Set Auto / Forced ON / Forced OFF |

### Color meaning

| Color | Meaning |
|---|---|
| Blue | Auto |
| Green | Forced ON |
| Red | Forced OFF |
| Blinking green | Boost active |
| Blinking red | Tank full / problem |

---

## Suggested repository structure

```text
.
├── README.md
├── esphome/
│   └── deshumidificateur-example.yaml
├── custom-card/
│   └── raptor-dehumidifier-card.js
└── images/
    ├── internal-wiring-diagram.jpg
    ├── dehumidifier-installed.jpg
    ├── esp32-connected-to-dehumidifier.jpg
    ├── esp32-connected-to-control-board.jpg
    ├── attic-room-installation.jpg
    ├── probreeze-pb-d-27-eu-specifications.jpg
    └── control-board-closeup.jpg
```

---

## Suggested image names

| Image content | Recommended filename |
|---|---|
| Internal wiring diagram printed inside the unit | `internal-wiring-diagram.jpg` |
| Dehumidifier installed under shelves | `dehumidifier-installed.jpg` |
| ESP connected to the dehumidifier | `esp32-connected-to-dehumidifier.jpg` |
| ESP in hand connected to control board | `esp32-connected-to-control-board.jpg` |
| Room overview / attic installation | `attic-room-installation.jpg` |
| Device specification label | `probreeze-pb-d-27-eu-specifications.jpg` |
| Control board close-up | `control-board-closeup.jpg` |

---

## Notes

This project was tested on a Pro Breeze PB-D-27-EU. Other Pro Breeze or Tuya-based dehumidifiers may use different datapoints.

Always verify UART voltage levels, pinout, and datapoints before connecting an ESP.
