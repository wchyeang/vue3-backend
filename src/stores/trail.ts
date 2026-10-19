import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

export type TrailKey = 'none' | 'cursor' | 'pixel' | 'textRain';

export const useTrailStore = defineStore('trail', () => {
  const active = useLocalStorage<TrailKey>('trail', 'none');

  function setTrail(key: TrailKey) {
    active.value = key;
  }

  return { active, setTrail };
});
