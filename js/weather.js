/**
 * weather.js
 * Intégration Open-Meteo (gratuit, sans clé API).
 * Doc : https://open-meteo.com/en/docs
 */

const Weather = {

  async getSolarForecast(lat, lon) {
    if (!lat || !lon) return null;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=shortwave_radiation,cloud_cover,temperature_2m&forecast_days=1&timezone=auto`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return this.parse(data);
    } catch (err) {
      console.warn('[Weather] Erreur Open-Meteo:', err.message);
      return null;
    }
  },

  parse(data) {
    const now = new Date();
    const times = data.hourly.time;
    const rad = data.hourly.shortwave_radiation;
    const clouds = data.hourly.cloud_cover;
    const temp = data.hourly.temperature_2m;

    let startIdx = times.findIndex(t => new Date(t) >= now);
    if (startIdx === -1) startIdx = 0;

    const hours = [];
    for (let i = startIdx; i < Math.min(startIdx + 6, times.length); i++) {
      hours.push({
        time: new Date(times[i]),
        radiation: rad[i] ?? 0,
        cloudCover: clouds[i] ?? 0,
        temp: temp[i] ?? null
      });
    }
    return hours;
  },

  iconFor(hour) {
    if (hour.radiation < 20) return '🌙';
    if (hour.cloudCover < 25) return '☀️';
    if (hour.cloudCover < 60) return '🌤';
    return '☁️';
  },

  buildTip(hours) {
    if (!hours || !hours.length) return 'Renseignez votre position dans les paramètres pour activer les prévisions.';
    const best = hours.reduce((a, b) => (b.radiation > a.radiation ? b : a), hours[0]);
    if (best.radiation < 50) {
      return "Peu d'ensoleillement prévu dans les prochaines heures : privilégiez une consommation modérée.";
    }
    const hh = best.time.getHours();
    return `Pic solaire estimé vers ${hh}h — c'est le moment idéal pour lancer vos appareils énergivores.`;
  }
};

window.Weather = Weather;
