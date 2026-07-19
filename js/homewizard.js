/**
 * homewizard.js
 * Communication locale avec les appareils HomeWizard (API v1, réseau local, sans clé API).
 * Doc officielle : https://api-documentation.homewizard.com/
 *
 * IMPORTANT :
 * - Ces appareils exposent une API HTTP non chiffrée sur le réseau local (port 80).
 * - "SolarFlux" doit donc être ouvert depuis un appareil sur le même réseau Wi-Fi,
 *   ou servi lui-même en HTTP (voir README pour les limitations HTTPS -> HTTP).
 */

const HomeWizard = {

  async fetchJSON(ip, path = '/api/v1/data') {
    if (!ip) return null;
    const url = `http://${ip}${path}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[HomeWizard] Erreur de connexion à', ip, err.message);
      return null;
    }
  },

  // Compteur P1 (électricité générale du foyer)
  async getP1(ip) {
    const data = await this.fetchJSON(ip);
    if (!data) return null;
    return {
      powerW: data.active_power_w ?? 0,               // + = consommation, - = injection
      totalImportKwh: data.total_power_import_kwh ?? 0,
      totalExportKwh: data.total_power_export_kwh ?? 0,
      voltage: data.active_voltage_l1_v ?? null,
      raw: data
    };
  },

  // Energy Socket(s) — peut y en avoir plusieurs
  async getSockets(ipsCsv) {
    if (!ipsCsv) return [];
    const ips = ipsCsv.split(',').map(s => s.trim()).filter(Boolean);
    const results = await Promise.all(ips.map(async ip => {
      const data = await this.fetchJSON(ip);
      if (!data) return { ip, online: false, powerW: 0 };
      return {
        ip,
        online: true,
        powerW: data.active_power_w ?? 0,
        totalKwh: data.total_power_import_kwh ?? 0
      };
    }));
    return results;
  },

  // Compteur d'eau connecté (Watermeter)
  async getWater(ip) {
    const data = await this.fetchJSON(ip);
    if (!data) return null;
    return {
      totalLiters: data.total_liter_m3 ? data.total_liter_m3 * 1000 : (data.total_liter_offset_m3 ?? 0) * 1000,
      activeFlowLmin: data.active_liter_lpm ?? 0,
      raw: data
    };
  }
};

// Export global (utilisé par app.js)
window.HomeWizard = HomeWizard;
