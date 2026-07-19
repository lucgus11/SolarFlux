/**
 * app.js
 * Orchestration principale de SolarFlux.
 */

const App = {
  settings: null,
  pollTimer: null,
  weatherTimer: null,
  lastForecast: null,
  notifiedPeakToday: false,

  async init() {
    this.settings = Settings.get();
    Settings.bindUI();

    Particles.init(document.getElementById('particles'));
    HistoryChart.init(document.getElementById('historyChart'));

    await this.refresh();
    await this.refreshWeather();

    this.pollTimer = setInterval(() => this.refresh(), 10000);       // toutes les 10s
    this.weatherTimer = setInterval(() => this.refreshWeather(), 15 * 60000); // toutes les 15 min

    this.registerServiceWorker();
  },

  onSettingsSaved(newSettings) {
    this.settings = newSettings;
    this.refresh();
    this.refreshWeather();
  },

  async refresh() {
    const s = this.settings;
    const [p1, sockets, water] = await Promise.all([
      HomeWizard.getP1(s.ipP1),
      HomeWizard.getSockets(s.ipSockets),
      HomeWizard.getWater(s.ipWater)
    ]);

    const anyOnline = !!p1 || sockets.some(sk => sk.online) || !!water;
    this.setConnStatus(anyOnline);

    // Puissance nette : p1.powerW positif = tire du réseau (consommation nette)
    const netW = p1 ? p1.powerW : 0;
    const consumptionW = netW > 0 ? netW : 0;
    const productionW = netW < 0 ? -netW : 0;
    const socketsW = sockets.reduce((sum, sk) => sum + (sk.online ? sk.powerW : 0), 0);

    document.getElementById('valProd').textContent = `${Math.round(productionW)} W`;
    document.getElementById('valCons').textContent = `${Math.round(consumptionW + socketsW)} W`;
    document.getElementById('valSockets').textContent = `${Math.round(socketsW)} W`;

    // Coût / gain instantané en €/h -> on affiche un compteur "temps réel" cumulatif approximatif
    const netKw = netW / 1000;
    const eurPerHour = netKw >= 0 ? netKw * s.priceBuy : netKw * s.priceSell; // netKw négatif * priceSell -> négatif = gain
    const isPositive = netW <= 0; // production >= consommation

    this.updateHero(eurPerHour, isPositive);
    this.updateZenScore(productionW, consumptionW + socketsW, water);
    this.updateWater(water);
    this.updateAura(isPositive);

    HistoryChart.push(-eurPerHour); // signe inversé pour que "gain" soit positif visuellement
  },

  setConnStatus(online) {
    const chip = document.getElementById('connStatus');
    chip.textContent = online ? '● en ligne' : '● hors ligne';
    chip.className = `status-chip ${online ? 'status-on' : 'status-off'}`;
  },

  updateHero(eurPerHour, isPositive) {
    const heroValue = document.getElementById('heroValue');
    const heroLabel = document.getElementById('heroLabel');
    const heroSub = document.getElementById('heroSub');

    const cents = Math.abs(eurPerHour) * 100;
    heroValue.textContent = `${isPositive ? '+' : '-'}${cents.toFixed(1)} c€/h`;
    heroValue.classList.toggle('negative', !isPositive);
    heroLabel.textContent = isPositive ? 'Vous économisez / gagnez' : "Coût actuel de l'énergie";
    heroSub.textContent = isPositive
      ? 'Votre production couvre votre consommation'
      : 'Votre maison tire de l\'énergie du réseau';
  },

  updateZenScore(productionW, consumptionTotalW, water) {
    let score = 50;
    if (consumptionTotalW > 0 || productionW > 0) {
      const ratio = productionW / Math.max(consumptionTotalW, 1);
      score = Math.min(100, Math.round(ratio * 70));
    }
    // Pénalité légère si grosse conso d'eau (>150L cumulés = pénalité)
    if (water && water.totalLiters) {
      const dayLiters = water.totalLiters % 100000; // approx, dépend du compteur
      if (dayLiters > 150) score -= 10;
    }
    score = Math.max(0, Math.min(100, score));

    document.getElementById('zenScoreValue').textContent = score;
    const ring = document.getElementById('zenRingFg');
    const circumference = 326.7;
    const offset = circumference - (score / 100) * circumference;
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = score >= 50 ? '#7dffb3' : '#7c8dff';
  },

  updateWater(water) {
    const litersToday = water ? (water.totalLiters % 500) : 0; // valeur relative d'illustration
    const flow = water ? water.activeFlowLmin : 0;
    document.getElementById('valWater').textContent = water ? Math.round(litersToday) : '--';
    document.getElementById('valFlow').textContent = water ? flow.toFixed(1) : '--';

    const maxLiters = 300; // capacité visuelle de la jauge
    const pct = Math.max(0, Math.min(1, litersToday / maxLiters));
    const fill = document.getElementById('waterFill');
    const y = 130 - pct * 130;
    fill.setAttribute('y', y);
  },

  updateAura(isPositive) {
    const root = document.documentElement;
    if (isPositive) {
      root.style.setProperty('--aura-a', '#ffd166');
      root.style.setProperty('--aura-b', '#7dffb3');
      Particles.setMode('positive');
    } else {
      root.style.setProperty('--aura-a', '#7c8dff');
      root.style.setProperty('--aura-b', '#b07cff');
      Particles.setMode('negative');
    }
  },

  async refreshWeather() {
    const { lat, lon } = this.settings;
    const forecastEl = document.getElementById('weatherForecast');
    const tipEl = document.getElementById('weatherTip');

    if (!lat || !lon) {
      forecastEl.innerHTML = '<div class="forecast-empty">Renseignez votre position dans les paramètres ⚙</div>';
      tipEl.textContent = '—';
      return;
    }

    const hours = await Weather.getSolarForecast(lat, lon);
    this.lastForecast = hours;
    if (!hours) {
      forecastEl.innerHTML = '<div class="forecast-empty">Prévisions indisponibles</div>';
      return;
    }

    forecastEl.innerHTML = hours.map(h => `
      <div class="forecast-item">
        <div class="fh">${h.time.getHours()}h</div>
        <div class="fi">${Weather.iconFor(h)}</div>
        <div class="fv">${Math.round(h.radiation)} W/m²</div>
      </div>
    `).join('');

    tipEl.textContent = Weather.buildTip(hours);

    this.maybeNotifyPeak(hours);
  },

  maybeNotifyPeak(hours) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = new Date();
    const peak = hours.reduce((a, b) => (b.radiation > a.radiation ? b : a), hours[0]);
    const isNow = peak.time.getHours() === now.getHours();
    const key = `notif_peak_${now.toDateString()}_${now.getHours()}`;

    if (isNow && peak.radiation > 400 && !sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      new Notification('☀️ Le soleil est au zénith !', {
        body: "C'est le moment idéal pour lancer vos appareils gratuitement.",
        icon: 'icons/icon-192.svg'
      });
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(err => {
        console.warn('[SW] Échec enregistrement :', err);
      });
    }
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
