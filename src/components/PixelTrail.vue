<template>
  <canvas ref="canvasRef" class="pixel-trail-canvas" />
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  defineOptions({
    name: 'PixelTrail',
  });

  const CELL_SIZE = 14;
  const GLOW_RADIUS = 3;
  const DECAY = 0.035;

  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let ctx: CanvasRenderingContext2D | null = null;
  let rafId = 0;
  let running = false;
  let cols = 0;
  let rows = 0;
  let grid: Float32Array;
  let moved = false;
  const dirtyCells = new Set<number>();
  // 画布逻辑尺寸（CSS 像素，等于视口尺寸）
  let width = window.innerWidth;
  let height = window.innerHeight;

  const pointer = { x: 0.5 * width, y: 0.5 * height };

  function cellIndex(col: number, row: number): number {
    return row * cols + col;
  }

  function activateCell(col: number, row: number, brightness: number) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    const idx = cellIndex(col, row);
    if (grid[idx]! < brightness) {
      grid[idx] = brightness;
      dirtyCells.add(idx);
    }
  }

  function glow(centerCol: number, centerRow: number) {
    for (let dr = -GLOW_RADIUS; dr <= GLOW_RADIUS; dr++) {
      for (let dc = -GLOW_RADIUS; dc <= GLOW_RADIUS; dc++) {
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist > GLOW_RADIUS) continue;
        const brightness = 1 - dist / GLOW_RADIUS;
        activateCell(centerCol + dc, centerRow + dr, brightness);
      }
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
    cols = Math.ceil(width / CELL_SIZE);
    rows = Math.ceil(height / CELL_SIZE);
    grid = new Float32Array(cols * rows);
    dirtyCells.clear();
    moved = false;
    pointer.x = width * 0.5;
    pointer.y = height * 0.5;
  }

  function handleMouseMove(e: MouseEvent) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    moved = true;
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function handleTouchMove(e: TouchEvent) {
    pointer.x = e.touches[0]!.clientX;
    pointer.y = e.touches[0]!.clientY;
    moved = true;
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(tick);
    }
  }

  function handleResize() {
    setupCanvas();
  }

  function tick() {
    if (!ctx) return;
    const canvas = canvasRef.value;
    if (!canvas) return;

    ctx.clearRect(0, 0, width, height);

    if (moved) {
      const cursorCol = Math.floor(pointer.x / CELL_SIZE);
      const cursorRow = Math.floor(pointer.y / CELL_SIZE);
      glow(cursorCol, cursorRow);
      moved = false;
    }

    let hasLit = false;

    for (const idx of dirtyCells) {
      const brightness = grid[idx]!;
      if (brightness <= 0) continue;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = col * CELL_SIZE + 1;
      const y = row * CELL_SIZE + 1;
      const size = CELL_SIZE - 2;
      const radius = 3;
      const alpha = brightness * 0.18;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + size - radius, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
      ctx.lineTo(x + size, y + size - radius);
      ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
      ctx.lineTo(x + radius, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.5).toFixed(3)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      grid[idx] = Math.max(0, brightness - DECAY);
      if (grid[idx]! > 0.005) {
        hasLit = true;
      }
    }

    if (!hasLit) {
      ctx.clearRect(0, 0, width, height);
      running = false;
      dirtyCells.clear();
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
  .pixel-trail-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    will-change: transform;
    mix-blend-mode: difference;
  }
</style>
