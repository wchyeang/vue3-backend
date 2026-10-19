<template>
  <canvas ref="canvasRef" class="textrain-trail-canvas" />
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  defineOptions({
    name: 'TextRainTrail',
  });

  const MAX_PARTICLES = 80;
  const FONT_SIZE = 20;
  const SPAWN_DISTANCE = 10;

  const EMOJI_RANGES: [number, number][] = [
    [0x1f600, 0x1f64f],
    [0x1f300, 0x1f5ff],
    [0x1f680, 0x1f6c5],
    [0x1f900, 0x1f9ff],
  ];

  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let ctx: CanvasRenderingContext2D | null = null;
  let rafId = 0;
  let running = false;
  let lastSpawnX = -1000;
  let lastSpawnY = -1000;

  // 画布逻辑尺寸（CSS 像素，等于视口尺寸）
  let width = window.innerWidth;
  let height = window.innerHeight;

  const pointer = { x: 0.5 * width, y: 0.5 * height };

  interface RainDrop {
    x: number;
    y: number;
    emoji: string;
    speed: number;
    opacity: number;
    life: number;
  }

  const particles: RainDrop[] = [];

  function randomEmoji(): string {
    const range = EMOJI_RANGES[Math.floor(Math.random() * EMOJI_RANGES.length)]!;
    const codePoint = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
    return String.fromCodePoint(codePoint);
  }

  function trySpawn() {
    const dx = pointer.x - lastSpawnX;
    const dy = pointer.y - lastSpawnY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SPAWN_DISTANCE) return;


    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }
    const count = dist > 60 ? 3 : 1;
    for (let c = 0; c < count; c++) {
      particles.push({
        x: pointer.x + (Math.random() - 0.5) * 40,
        y: pointer.y + (Math.random() - 0.5) * 10,
        emoji: randomEmoji(),
        speed: 1 + Math.random() * 2,
        opacity: 1,
        life: 50 + Math.floor(Math.random() * 50),
      });
    }

    lastSpawnX = pointer.x;
    lastSpawnY = pointer.y;
  }

  function handleMouseMove(e: MouseEvent) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    trySpawn();
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    pointer.x = e.touches[0]!.clientX;
    pointer.y = e.touches[0]!.clientY;
    trySpawn();
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function setupCanvas() {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 复位状态：避免切屏后旧粒子/指针错位
    pointer.x = width * 0.5;
    pointer.y = height * 0.5;
    particles.length = 0;
    lastSpawnX = -1000;
    lastSpawnY = -1000;
  }

  function handleResize() {
    setupCanvas();
  }

  function tick() {
    if (!ctx) return;
    const canvas = canvasRef.value;
    if (!canvas) return;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${FONT_SIZE}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      p.y += p.speed;
      p.life--;
      p.opacity = Math.max(0, p.life / 80);

      if (p.life <= 0 || p.y > height + FONT_SIZE) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.opacity;
      ctx.fillText(p.emoji, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    if (particles.length === 0) {
      ctx.clearRect(0, 0, width, height);
      running = false;
      return;
    }

    rafId = requestAnimationFrame(tick);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;

    setupCanvas();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('resize', handleResize);
    ctx = null;
  });
</script>

<style scoped>
  .textrain-trail-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    will-change: transform;
  }
</style>
