/**
 * settings.js
 * Gestion des paramètres utilisateur (IP des appareils HomeWizard, position, tarifs).
 * Stockage 100% local via localStorage — aucune donnée n'est envoyée à un serveur.
 */

const SETTINGS_KEY = 'solarflux_settings_v1';

const Settings = {
  defaults: {
    ipP1: '',
    ipSockets: '',
    ipWater: '',
    lat: '',
    lon: '',
    priceBuy: 0.32,
    priceSell: 0.06
  },

  get() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...this.defaults, ...JSON.parse(raw) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  },

  save(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  bindUI() {
    const s = this.get();
    document.getElementById('ipP1').value = s.ipP1;
    document.getElementById('ipSockets').value = s.ipSockets;
    document.getElementById('ipWater').value = s.ipWater;
    document.getElementById('lat').value = s.lat;
    document.getElementById('lon').value = s.lon;
    document.getElementById('priceBuy').value = s.priceBuy;
    document.getElementById('priceSell').value = s.priceSell;

    const overlay = document.getElementById('settingsPanel');

    document.getElementById('btnSettings').addEventListener('click', () => {
      overlay.classList.remove('hidden');
    });
    document.getElementById('btnCloseSettings').addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });

    document.getElementById('btnSaveSettings').addEventListener('click', () => {
      const newSettings = {
        ipP1: document.getElementById('ipP1').value.trim(),
        ipSockets: document.getElementById('ipSockets').value.trim(),
        ipWater: document.getElementById('ipWater').value.trim(),
        lat: document.getElementById('lat').value.trim(),
        lon: document.getElementById('lon').value.trim(),
        priceBuy: parseFloat(document.getElementById('priceBuy').value) || this.defaults.priceBuy,
        priceSell: parseFloat(document.getElementById('priceSell').value) || this.defaults.priceSell
      };
      this.save(newSettings);
      overlay.classList.add('hidden');
      if (window.App && typeof window.App.onSettingsSaved === 'function') {
        window.App.onSettingsSaved(newSettings);
      }
    });

    document.getElementById('btnEnableNotif').addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert('Les notifications ne sont pas supportées par ce navigateur.');
        return;
      }
      const perm = await Notification.requestPermission();
      alert(perm === 'granted' ? 'Notifications activées ✅' : 'Notifications refusées.');
    });
  }
};

window.Settings = Settings;
