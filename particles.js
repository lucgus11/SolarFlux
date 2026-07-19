/**
 * particles.js
 * Petites particules lumineuses flottantes pour matérialiser le flux d'énergie.
 * Couleur pilotée par l'état (positif/négatif) via Particles.setMode().
 */

const Particles = {
  canvas: null,
  ctx: null,
  items: [],
  mode: 'positive', // 'positive' | 'negative'
  raf: null,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.seed();
    this.loop();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  seed() {
    const count = Math.min(50, Math.floor(window.innerWidth / 25));
    this.items = Array.from({ length: count }, () => this.newParticle());
  },

  newParticle() {
    return {
      x: Math.random() * (this.canvas?.width || window.innerWidth),
      y: (this.canvas?.height || window.innerHeight) + Math.random() * 100,
      r: 1 + Math.random() * 2.2,
      speed: 0.2 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      alpha: 0.15 + Math.random() * 0.5
    };
  },

  setMode(mode) {
    this.mode = mode;
  },

  loop() {
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const color = this.mode === 'positive' ? '255,209,102' : '124,141,255';

    for (const p of this.items) {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) Object.assign(p, this.newParticle(), { y: h + 10 });

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${color},0.8)`;
      ctx.fill();
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }
};

window.Particles = Particles;
