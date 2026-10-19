<template>
  <component :is="activeTrail" v-if="activeTrail" />
  <RouterView />
</template>

<script setup lang="ts">
  defineOptions({
    name: 'App'
  });
  import { computed, defineAsyncComponent } from 'vue';
  import type { Component } from 'vue';
  import { RouterView } from 'vue-router';
  import { useTrailStore } from '@/stores/trail';

  const trailStore = useTrailStore();

  const trailMap: Record<string, Component> = {
    cursor: defineAsyncComponent(() => import('@/components/CursorTrail.vue')),
    pixel: defineAsyncComponent(() => import('@/components/PixelTrail.vue')),
    textRain: defineAsyncComponent(() => import('@/components/TextRainTrail.vue')),
  };

  const activeTrail = computed(() => trailMap[trailStore.active] || null);
</script>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body,
  #app {
    height: 100%;
  }

  body {
    font-size: var(--text-base);
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
</style>
