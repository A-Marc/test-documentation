(() => {
  'use strict';

  // ── Constants ──
  const CELL_SIZE = 36;
  const ACCENT = { r: 60, g: 70, b: 85 };
  const MAX_WAKES = 300;
  const MOUSE_REPULSION_RADIUS = 120;
  const MOUSE_GLOW_RADIUS = 180;
  const BOAT_WRAP_MARGIN = 60;

  const BOAT_TYPES = [
    { name: 'carrier', len: 5, w: 0.6 },
    { name: 'battleship', len: 4, w: 0.55 },
    { name: 'cruiser', len: 3, w: 0.5 },
    { name: 'sub', len: 3, w: 0.35 },
    { name: 'destroyer', len: 2, w: 0.45 },
  ];

  // ── State ──
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W, H;
  let grid = [];
  let boats = [];
  let wakes = [];
  let mouse = { x: -1000, y: -1000 };
  let time = 0;

  // ── Helpers ──
  function rgba(color, alpha) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  }

  function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Grid ──
  function createGrid() {
    grid = [];
    const cols = Math.ceil(W / CELL_SIZE) + 1;
    const rows = Math.ceil(H / CELL_SIZE) + 1;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid.push({ x: i * CELL_SIZE, y: j * CELL_SIZE });
      }
    }
  }

  function drawGrid() {
    const cols = Math.ceil(W / CELL_SIZE) + 1;
    const rows = Math.ceil(H / CELL_SIZE) + 1;

    // Grid lines
    ctx.strokeStyle = rgba(ACCENT, 0.04);
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, H);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL_SIZE);
      ctx.lineTo(W, j * CELL_SIZE);
      ctx.stroke();
    }

    // Intersection dots with mouse glow
    for (const g of grid) {
      const dist = distance(g.x, g.y, mouse.x, mouse.y);
      const glow = dist < MOUSE_GLOW_RADIUS ? (1 - dist / MOUSE_GLOW_RADIUS) * 0.6 : 0;

      ctx.beginPath();
      ctx.arc(g.x, g.y, 1 + glow * 2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(ACCENT, 0.25 + glow);
      ctx.fill();
    }
  }

  // ── Boats ──
  function createBoats() {
    boats = [];
    const count = 10 + Math.floor((W * H) / 150000);

    for (let i = 0; i < count; i++) {
      const type = BOAT_TYPES[Math.floor(Math.random() * BOAT_TYPES.length)];
      const scale = 0.5 + Math.random() * 0.6;
      boats.push({
        x: Math.random() * W,
        y: Math.random() * H,
        angle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.002,
        len: type.len * CELL_SIZE * 0.35 * scale,
        w: type.w * CELL_SIZE * 0.35 * scale,
        type: type.name,
        opacity: 0.12 + Math.random() * 0.25,
        flickerPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  function updateBoats() {
    for (const b of boats) {
      b.x += Math.cos(b.angle) * b.speed;
      b.y += Math.sin(b.angle) * b.speed;
      b.angle += b.drift;

      // Wrap around screen
      if (b.x > W + BOAT_WRAP_MARGIN) b.x = -BOAT_WRAP_MARGIN;
      if (b.x < -BOAT_WRAP_MARGIN) b.x = W + BOAT_WRAP_MARGIN;
      if (b.y > H + BOAT_WRAP_MARGIN) b.y = -BOAT_WRAP_MARGIN;
      if (b.y < -BOAT_WRAP_MARGIN) b.y = H + BOAT_WRAP_MARGIN;

      // Mouse repulsion
      const dist = distance(b.x, b.y, mouse.x, mouse.y);
      if (dist < MOUSE_REPULSION_RADIUS) {
        const force = (1 - dist / MOUSE_REPULSION_RADIUS) * 0.8;
        b.x += ((b.x - mouse.x) / dist) * force;
        b.y += ((b.y - mouse.y) / dist) * force;
      }
    }
  }

  function drawBoat(b) {
    const { x, y, angle, len, w, opacity, flickerPhase } = b;
    const flicker = 0.85 + Math.sin(time * 0.5 + flickerPhase) * 0.15;
    const alpha = opacity * flicker;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Hull
    ctx.beginPath();
    ctx.moveTo(len * 0.5, 0);
    ctx.lineTo(len * 0.2, -w);
    ctx.lineTo(-len * 0.4, -w);
    ctx.lineTo(-len * 0.5, -w * 0.5);
    ctx.lineTo(-len * 0.5, w * 0.5);
    ctx.lineTo(-len * 0.4, w);
    ctx.lineTo(len * 0.2, w);
    ctx.closePath();
    ctx.fillStyle = rgba(ACCENT, alpha * 0.15);
    ctx.fill();
    ctx.strokeStyle = rgba(ACCENT, alpha);
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Deck line
    ctx.beginPath();
    ctx.moveTo(-len * 0.3, 0);
    ctx.lineTo(len * 0.3, 0);
    ctx.strokeStyle = rgba(ACCENT, alpha * 0.5);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Superstructure (carrier / battleship)
    if (b.type === 'carrier' || b.type === 'battleship') {
      ctx.fillStyle = rgba(ACCENT, alpha * 0.3);
      ctx.fillRect(-len * 0.1, -w * 0.5, len * 0.15, w);
    }

    // Turrets (battleship / cruiser)
    if (b.type === 'battleship' || b.type === 'cruiser') {
      ctx.beginPath();
      ctx.arc(len * 0.25, 0, w * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = rgba(ACCENT, alpha * 0.4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(len * 0.25, 0);
      ctx.lineTo(len * 0.45, 0);
      ctx.strokeStyle = rgba(ACCENT, alpha * 0.6);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Periscope (sub)
    if (b.type === 'sub') {
      ctx.beginPath();
      ctx.arc(len * 0.1, 0, w * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(ACCENT, alpha * 0.4);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ── Wakes ──
  function updateWakes() {
    // Spawn new particles from some boats
    for (let i = 0; i < boats.length; i += 3) {
      const b = boats[i];
      if (Math.random() > 0.3) continue;
      wakes.push({
        x: b.x - Math.cos(b.angle) * b.len * 0.5,
        y: b.y - Math.sin(b.angle) * b.len * 0.5,
        life: 1,
        decay: 0.008 + Math.random() * 0.008,
        size: 1 + Math.random() * 1.5,
      });
    }

    // Update and draw
    for (let i = wakes.length - 1; i >= 0; i--) {
      const w = wakes[i];
      w.life -= w.decay;
      if (w.life <= 0) {
        wakes.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.size * w.life, 0, Math.PI * 2);
      ctx.fillStyle = rgba(ACCENT, w.life * 0.12);
      ctx.fill();
    }

    if (wakes.length > MAX_WAKES) wakes.splice(0, wakes.length - MAX_WAKES);
  }

  // ── Main loop ──
  function animate() {
    time += 0.016;
    ctx.clearRect(0, 0, W, H);

    drawGrid();
    updateWakes();
    updateBoats();

    for (const b of boats) {
      drawBoat(b);
    }

    requestAnimationFrame(animate);
  }

  // ── Setup ──
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    createGrid();
    createBoats();
  }

  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  resize();
  animate();
})();
