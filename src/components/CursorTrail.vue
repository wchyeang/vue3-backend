<template>
  <canvas ref="canvasRef" class="cursor-trail-canvas" />
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useThemeStore } from '@/stores/theme';

  defineOptions({
    name: 'CursorTrail',
  });

  const canvasRef = ref<HTMLCanvasElement | null>(null);

  const themeStore = useThemeStore();

  let ctx: CanvasRenderingContext2D | null = null;
  let rafId = 0;

  let running = false;

  // 画布逻辑尺寸（CSS 像素，等于视口尺寸）
  let width = window.innerWidth;
  let height = window.innerHeight;

  const pointer = {
    x: 0.5 * width,
    y: 0.5 * height,
  };

  const params = {
    pointsNumber: 40,
    widthFactor: 0.3,
    spring: 0.4,
    friction: 0.5,
  };

  interface TrailPoint {
    x: number;
    y: number;
    dx: number;
    dy: number;
  }

  const trail: TrailPoint[] = Array.from({ length: params.pointsNumber });
  for (let i = 0; i < params.pointsNumber; i++) {
    trail[i] = {
      x: pointer.x,
      y: pointer.y,
      dx: 0,
      dy: 0,
    };
  }

  function updateMousePosition(eX: number, eY: number) {
    pointer.x = eX;
    pointer.y = eY;
  }

  function handleMouseMove(e: MouseEvent) {
    updateMousePosition(e.clientX, e.clientY);
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    updateMousePosition(e.touches[0]!.clientX, e.touches[0]!.clientY);
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
    // 复位：避免切屏后拖尾从旧坐标"甩"向新位置
    pointer.x = width * 0.5;
    pointer.y = height * 0.5;
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i]!;
      p.x = pointer.x;
      p.y = pointer.y;
      p.dx = 0;
      p.dy = 0;
    }
  }

  function handleResize() {
    setupCanvas();
  }

  function isTrailConverged(): boolean {
    const threshold = 0.05;
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i]!;
      const prev = i === 0 ? pointer : trail[i - 1]!;
      if (Math.abs(p.x - prev.x) > threshold || Math.abs(p.y - prev.y) > threshold) {
        return false;
      }
    }
    return true;
  }

  function tick() {
    if (!ctx) return;

    const canvas = canvasRef.value;
    if (!canvas) return;

    trail.forEach((p, pIdx) => {
      const prev = pIdx === 0 ? pointer : trail[pIdx - 1]!;
      const spring = pIdx === 0 ? 0.4 * params.spring : params.spring;
      p.dx += (prev.x - p.x) * spring;
      p.dy += (prev.y - p.y) * spring;
      p.dx *= params.friction;
      p.dy *= params.friction;
      p.x += p.dx;
      p.y += p.dy;
    });

    if (isTrailConverged()) {
      ctx.clearRect(0, 0, width, height);
      running = false;
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // 跟随主题：暗色用白色半透明便于识别，亮色用黑色半透明
    ctx.strokeStyle = themeStore.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)';

    ctx.beginPath();
    ctx.moveTo(trail[0]!.x, trail[0]!.y);

    for (let i = 1; i < trail.length - 1; i++) {
      const xc = 0.5 * (trail[i]!.x + trail[i + 1]!.x);
      const yc = 0.5 * (trail[i]!.y + trail[i + 1]!.y);
      ctx.quadraticCurveTo(trail[i]!.x, trail[i]!.y, xc, yc);
      ctx.lineWidth = params.widthFactor * (params.pointsNumber - i);
      ctx.stroke();
    }
    ctx.lineTo(trail[trail.length - 1]!.x, trail[trail.length - 1]!.y);
    ctx.stroke();

    rafId = requestAnimationFrame(tick);
  }

  onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';

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
  .cursor-trail-canvas {
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
