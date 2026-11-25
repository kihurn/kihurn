export interface ThemeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  accent: boolean;
}

export function createThemeBurstParticles(
  originX: number,
  originY: number,
  count = 42,
): ThemeParticle[] {
  const safeCount = Math.max(8, Math.min(80, Math.round(count)));
  return Array.from({ length: safeCount }, (_, i) => {
    const ratio = i / safeCount;
    const angle = ratio * Math.PI * 2 + (i % 3) * 0.21;
    const speed = 2.4 + ((i * 19) % 13) * 0.42;
    const maxLife = 24 + (i % 10) * 2;
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.4 + (i % 3) * 0.85,
      alpha: 0.72,
      life: 0,
      maxLife,
      accent: i % 8 === 0,
    };
  });
}

export function stepThemeBurstParticles(particles: ThemeParticle[]): ThemeParticle[] {
  const active: ThemeParticle[] = [];
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const nextLife = p.life + 1;
    if (nextLife >= p.maxLife) continue;
    const progress = nextLife / p.maxLife;
    active.push({
      x: p.x + p.vx,
      y: p.y + p.vy,
      vx: p.vx * 0.93,
      vy: p.vy * 0.93 + 0.04,
      size: p.size,
      alpha: Number((0.76 * (1 - progress * progress)).toFixed(3)),
      life: nextLife,
      maxLife: p.maxLife,
      accent: p.accent,
    });
  }
  return active;
}
