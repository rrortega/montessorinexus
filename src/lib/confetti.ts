// Lightweight high-performance HTML5 Canvas Confetti burst
export function triggerConfetti(durationMs: number = 3000) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    '#10B981', '#059669', '#3B82F6', '#6366F1',
    '#EC4899', '#F59E0B', '#8B5CF6', '#14B8A6', '#F43F5E'
  ];

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    angleSpeed: number;
    size: number;
    color: string;
    shape: 'rect' | 'circle';
    alpha: number;
    decay: number;
  }

  const particles: Particle[] = [];
  const particleCount = 150;

  // Origin points: bottom-left, bottom-center, bottom-right
  const origins = [
    { x: width * 0.25, y: height * 0.7 },
    { x: width * 0.5, y: height * 0.65 },
    { x: width * 0.75, y: height * 0.7 }
  ];

  for (let i = 0; i < particleCount; i++) {
    const origin = origins[i % origins.length];
    const angle = (Math.random() * Math.PI * 0.8) + (Math.PI * 0.1); // upward spray
    const speed = Math.random() * 16 + 12;

    particles.push({
      x: origin.x + (Math.random() * 60 - 30),
      y: origin.y + (Math.random() * 40 - 20),
      vx: Math.cos(angle) * speed * (origin.x < width * 0.5 ? 1 : (origin.x > width * 0.5 ? -1 : (Math.random() - 0.5) * 2)),
      vy: -Math.sin(angle) * speed,
      angle: Math.random() * 360,
      angleSpeed: (Math.random() - 0.5) * 12,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      alpha: 1,
      decay: Math.random() * 0.015 + 0.008
    });
  }

  const startTime = performance.now();

  function render(time: number) {
    const elapsed = time - startTime;
    ctx!.clearRect(0, 0, width, height);

    let activeParticles = 0;
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      activeParticles++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravity
      p.vx *= 0.98; // air drag
      p.angle += p.angleSpeed;
      p.alpha = Math.max(0, p.alpha - p.decay);

      ctx!.save();
      ctx!.globalAlpha = p.alpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.angle * Math.PI) / 180);
      ctx!.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    if (elapsed < durationMs && activeParticles > 0) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(render);
}
