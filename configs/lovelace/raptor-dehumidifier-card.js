class RaptorDehumidifierCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity_power || !config.entity_humidity || !config.entity_boost) {
      throw new Error("entity_power, entity_humidity et entity_boost sont obligatoires");
    }

    this.config = {
      title: "Déshumidificateur",
      size: "large",
      entity_power: null,
      entity_humidity: null,
      entity_target: null,
      entity_tank_full: null,
      entity_boost: null,
      entity_stop_boost: null,
      entity_boost_state: null,
      entity_mode: null,
      long_press_path: null,
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getGridOptions() {
    if (this.config.size === "small") return { columns: 3, rows: 1 };
    if (this.config.size === "medium") return { columns: 6, rows: 2 };
    return {};
  }

  getBoostStorageKey() {
    return `raptor_dehumidifier_boost_${this.config.entity_boost}`;
  }

  getStoredBoostUntil() {
    return parseInt(localStorage.getItem(this.getBoostStorageKey()) || "0", 10);
  }

  setStoredBoostOn() {
    localStorage.setItem(this.getBoostStorageKey(), String(Date.now() + 3600000));
  }

  setStoredBoostOff() {
    localStorage.removeItem(this.getBoostStorageKey());
  }

  getState(entity) {
    return entity && this._hass.states[entity] ? this._hass.states[entity].state : null;
  }

  num(entity, fallback = 0) {
    const v = parseFloat(String(this.getState(entity)).replace(",", "."));
    return Number.isFinite(v) ? v : fallback;
  }

  isBoostActive() {
    const storedUntil = this.getStoredBoostUntil();
    if (storedUntil > Date.now()) return true;

    const s = String(this.getState(this.config.entity_boost_state) || "").toLowerCase();

    if (!s || s.includes("inactif") || s.includes("unknown") || s.includes("unavailable")) {
      return false;
    }

    return s.includes("actif") || s.includes("encore") || s.includes("min");
  }

  isTankFull() {
    return this.getState(this.config.entity_tank_full) === "on";
  }

  getMode() {
    return this.getState(this.config.entity_mode) || "Auto";
  }

  getModeClass() {
    if (this.isTankFull()) return "tank";
    if (this.isBoostActive()) return "boost";

    const m = this.getMode().toLowerCase();

    if (m.includes("marche")) return "forced-on";
    if (m.includes("arrêt") || m.includes("arret")) return "forced-off";

    return "auto";
  }

  getLabel() {
    if (this.isTankFull()) return "BAC";
    if (this.isBoostActive()) return "BOOST";

    const m = this.getMode().toLowerCase();

    if (m.includes("marche")) return "ON";
    if (m.includes("arrêt") || m.includes("arret")) return "OFF";

    return "";
  }

  async toggleBoost() {
    if (this.isBoostActive()) {
      this.setStoredBoostOff();

      await this._hass.callService("button", "press", {
        entity_id: this.config.entity_stop_boost,
      });
    } else {
      this.setStoredBoostOn();

      await this._hass.callService("button", "press", {
        entity_id: this.config.entity_boost,
      });
    }

    this.render();
  }

  async setMode(mode) {
    await this._hass.callService("select", "select_option", {
      entity_id: this.config.entity_mode,
      option: mode,
    });
  }

  openMoreInfo() {
    if (!this.config.long_press_path) return;
    window.history.pushState(null, "", this.config.long_press_path);
    window.dispatchEvent(new Event("location-changed"));
  }

  attachPress(target) {
    if (!target) return;

    let timer = null;
    let longPress = false;

    const down = (e) => {
      if (e.target.closest("button")) return;

      longPress = false;
      timer = setTimeout(() => {
        longPress = true;
        this.openMoreInfo();
      }, 650);
    };

    const up = (e) => {
      if (e.target.closest("button")) return;

      clearTimeout(timer);

      if (!longPress) {
        this.toggleBoost();
      }
    };

    const cancel = () => clearTimeout(timer);

    target.addEventListener("pointerdown", down);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointerleave", cancel);
    target.addEventListener("pointercancel", cancel);
  }

  renderFan(on, label) {
    return `
      <div class="fan-wrap">
        <svg class="${on ? "fan spinning" : "fan"}" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="9" fill="currentColor"></circle>
          <path d="M50 12 C70 13 76 31 62 42 C54 48 45 43 44 34 C43 25 45 17 50 12Z" fill="currentColor" opacity="0.92"></path>
          <path d="M86 58 C77 76 56 76 53 58 C52 48 60 43 68 47 C77 51 83 54 86 58Z" fill="currentColor" opacity="0.76"></path>
          <path d="M21 75 C10 58 21 40 38 47 C47 51 47 61 40 67 C33 73 27 76 21 75Z" fill="currentColor" opacity="0.60"></path>
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-opacity="0.16" stroke-width="4"></circle>
        </svg>
        ${label ? `<div class="fan-label">${label}</div>` : ""}
      </div>
    `;
  }

  renderGauge(h, target) {
    const r = 46;
    const c = 2 * Math.PI * r;
    const dash = c * Math.min(1, Math.max(0, h / 100));
    const gap = c - dash;

    return `
      <svg class="gauge" viewBox="0 0 120 120">
        <circle class="gauge-bg" cx="60" cy="60" r="${r}"></circle>
        <circle class="gauge-value" cx="60" cy="60" r="${r}" stroke-dasharray="${dash} ${gap}"></circle>
        <text class="gauge-number" x="60" y="57" text-anchor="middle">${Math.round(h)}%</text>
        <text class="gauge-target-text" x="60" y="78" text-anchor="middle">cible ${Math.round(target)}%</text>
      </svg>
    `;
  }

  render() {
    if (!this._hass || !this.config) return;

    const size = this.config.size || "large";
    const isSmall = size === "small";
    const isMedium = size === "medium";

    const power = this.getState(this.config.entity_power) === "on";
    const humidity = this.num(this.config.entity_humidity, 0);
    const target = this.num(this.config.entity_target, humidity);
    const boost = this.isBoostActive();
    const tank = this.isTankFull();
    const mode = this.getMode();
    const cls = this.getModeClass();
    const label = this.getLabel();

    const small = `
      <div class="mini-card ${cls}">
        ${this.renderFan(power || boost, label)}
        <div class="value">${Math.round(humidity)}%</div>
        ${boost ? `<div class="boost-badge">BOOST</div>` : ""}
        ${tank ? `<div class="alert">!</div>` : ""}
      </div>
    `;

    const medium = `
      <div class="mini-card medium ${cls}">
        ${this.renderFan(power || boost, label)}
        <div class="value medium-value">${Math.round(humidity)}%</div>
        ${boost ? `<div class="boost-badge">BOOST</div>` : ""}
        ${tank ? `<div class="alert">!</div>` : ""}
        <div class="modes">
          <button class="mode ${mode === "Auto" ? "active" : ""}" data-mode="Auto">A</button>
          <button class="mode ${mode === "Marche forcée" ? "active" : ""}" data-mode="Marche forcée">M</button>
          <button class="mode ${mode === "Arrêt forcé" ? "active" : ""}" data-mode="Arrêt forcé">O</button>
        </div>
      </div>
    `;

    const large = `
      <div class="large ${cls}">
        <div class="header">
          <div class="title">${this.config.title}</div>
          <div class="pill">${boost ? "BOOST ACTIF" : mode}</div>
        </div>

        <div class="main">
          <div class="fan-box">${this.renderFan(power || boost, label)}</div>
          <div class="gauge-box">${this.renderGauge(humidity, target)}</div>
        </div>

        ${tank ? `<div class="tank-alert">⚠️ BAC PLEIN</div>` : ""}

        <div class="large-modes">
          <button class="mode ${mode === "Auto" ? "active" : ""}" data-mode="Auto">Auto</button>
          <button class="mode ${mode === "Marche forcée" ? "active" : ""}" data-mode="Marche forcée">Marche</button>
          <button class="mode ${mode === "Arrêt forcé" ? "active" : ""}" data-mode="Arrêt forcé">Arrêt</button>
        </div>

        <button class="boost-button">${boost ? "⏹ Stop boost" : "⚡ Boost 1h"}</button>
      </div>
    `;

    this.innerHTML = `
      <ha-card>
        <style>
          :host { display:block; }

          .auto { --main:#00a6d6; --soft:rgba(0,166,214,.12); }
          .forced-on { --main:#00a86b; --soft:rgba(0,168,107,.14); }
          .forced-off { --main:#ff5252; --soft:rgba(255,82,82,.14); }
          .boost { --main:#00e676; --soft:rgba(0,230,118,.28); }
          .tank { --main:#ff1744; --soft:rgba(255,23,68,.22); }

          ha-card {
            overflow:hidden;
            border-radius:${isSmall ? "14px" : "18px"};
            width:100%;
            height:100%;
            cursor:pointer;
          }

          .mini-card {
            position:relative;
            width:100%;
            height:100%;
            min-height:42px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:var(--soft);
            color:var(--main);
            border-radius:12px;
            overflow:hidden;
          }

          .mini-card.boost {
            animation: boostPulse .75s infinite;
            box-shadow: 0 0 16px rgba(0,230,118,.85), inset 0 0 0 2px rgba(0,230,118,.45);
          }

          .fan-wrap {
            position:relative;
            width:${isSmall ? "32px" : isMedium ? "30px" : "92px"};
            height:${isSmall ? "32px" : isMedium ? "30px" : "92px"};
            display:flex;
            align-items:center;
            justify-content:center;
            color:var(--main);
          }

          .fan { width:100%; height:100%; opacity:${power || boost ? "1" : ".35"}; }
          .spinning { animation: spin .7s linear infinite; }

          .fan-label {
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:${isSmall ? "6px" : isMedium ? "5px" : "11px"};
            font-weight:950;
            line-height:1;
            text-align:center;
          }

          .value {
            position:absolute;
            right:4px;
            bottom:2px;
            font-size:9px;
            font-weight:900;
            color:var(--main);
          }

          .medium-value {
            top:5px;
            bottom:auto;
            right:6px;
            font-size:13px;
          }

          .boost-badge {
            position:absolute;
            left:4px;
            top:3px;
            padding:1px 4px;
            border-radius:999px;
            background:#00c853;
            color:white;
            font-size:7px;
            font-weight:950;
            z-index:5;
          }

          .alert {
            position:absolute;
            right:4px;
            top:4px;
            width:12px;
            height:12px;
            border-radius:50%;
            background:#ff1744;
            color:white;
            font-size:9px;
            font-weight:900;
            display:flex;
            align-items:center;
            justify-content:center;
            animation: blink .8s infinite;
          }

          .modes {
            position:absolute;
            right:4px;
            bottom:3px;
            display:flex;
            gap:2px;
          }

          .mode {
            border:none;
            border-radius:5px;
            padding:1px 4px;
            font-size:7px;
            font-weight:900;
            background:rgba(120,120,120,.16);
            color:var(--primary-text-color);
            cursor:pointer;
          }

          .mode.active {
            background:var(--main);
            color:white;
          }

          .large {
            padding:16px;
            color:var(--main);
          }

          .header {
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin-bottom:12px;
          }

          .title {
            font-size:22px;
            font-weight:900;
          }

          .pill {
            background:var(--soft);
            color:var(--main);
            padding:8px 14px;
            border-radius:999px;
            font-weight:850;
          }

          .main {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:16px;
          }

          .fan-box,
          .gauge-box {
            border-radius:24px;
            min-height:150px;
            background:var(--soft);
            display:flex;
            align-items:center;
            justify-content:center;
          }

          .gauge { width:150px; }
          .gauge-bg { fill:none; stroke:rgba(140,150,160,.20); stroke-width:10; }
          .gauge-value {
            fill:none;
            stroke:var(--main);
            stroke-width:10;
            stroke-linecap:round;
            transform:rotate(-90deg);
            transform-origin:60px 60px;
          }

          .gauge-number { font-size:25px; font-weight:900; fill:var(--primary-text-color); }
          .gauge-target-text { font-size:11px; fill:var(--secondary-text-color); }

          .large-modes {
            display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:8px;
            margin-top:12px;
          }

          .large-modes .mode {
            font-size:12px;
            padding:8px;
            border-radius:10px;
          }

          .boost-button {
            margin-top:12px;
            width:100%;
            height:42px;
            border:none;
            border-radius:12px;
            background:var(--main);
            color:white;
            font-weight:900;
            cursor:pointer;
          }

          .tank-alert {
            margin-top:12px;
            padding:10px;
            border-radius:12px;
            background:rgba(255,23,68,.16);
            color:#ff1744;
            text-align:center;
            font-weight:950;
            animation:blink .8s infinite;
          }

          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.45} }
          @keyframes boostPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.65)} }
        </style>

        ${isSmall ? small : isMedium ? medium : large}
      </ha-card>
    `;

    this.querySelectorAll(".mode").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setMode(btn.dataset.mode);
      });
    });

    this.querySelector(".boost-button")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleBoost();
    });

    this.attachPress(this.querySelector(".mini-card"));
  }
}

customElements.define("raptor-dehumidifier-card", RaptorDehumidifierCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "raptor-dehumidifier-card",
  name: "Raptor Dehumidifier Card",
  description: "Carte personnalisée pour déshumidificateur ESPHome",
});