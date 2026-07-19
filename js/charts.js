/**
 * charts.js
 * Mini-graphique d'historique (canvas natif, sans dépendance externe).
 * Affiche la tendance du solde du jour : jaune = positif (production > conso), bleu = négatif.
 */

const HistoryChart = {
  canvas: null,
  ctx: null,
  data: [], // { t: Date, value: number } value en euros (+ ou -)

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  },

  push(value) {
    this.data.push({ t: new Date(), value });
    // Garde uniquement les dernières 24h (~ toutes les entrées ajoutées)
    const cutoff = Date.now() - 24 * 3600 * 1000;
    this.data = this.data.filter(d => d.t.getTime() >= cutoff);
    this.draw();
  },

  draw() {
    if (!this.ctx) return;
    const w = this.canvas.getBoundingClientRect().width;
    const h = this.canvas.getBoundingClientRect().height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    if (this.data.length < 2) return;

    const values = this.data.map(d => d.value);
    const max = Math.max(...values, 0.01);
    const min = Math.min(...values, -0.01);
    const range = max - min || 1;
    const zeroY = h - ((0 - min) / range) * h;

    // ligne zéro
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    const stepX = w / (this.data.length - 1);

    for (let i = 0; i < this.data.length - 1; i++) {
      const v0 = this.data[i].value;
      const v1 = this.data[i + 1].value;
      const x0 = i * stepX;
      const x1 = (i + 1) * stepX;
      const y0 = h - ((v0 - min) / range) * h;
      const y1 = h - ((v1 - min) / range) * h;

      const positive = (v0 + v1) / 2 >= 0;
      ctx.strokeStyle = positive ? '#ffd166' : '#7c8dff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }
};

window.HistoryChart = HistoryChart;
