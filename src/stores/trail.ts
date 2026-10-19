import { defineStore } from 'pinia';
import { ref } from 'vue';

export type TrailKey = 'none' | 'cursor' | 'pixel' | 'textRain';

export const useTrailStore = defineStore('trail', () => {
  const active = ref<TrailKey>(
    (localStorage.getItem('trail') as TrailKey) || 'none',
  );

  function setTrail(key: TrailKey) {
    active.value = key;
    localStorage.setItem('trail', key);
  }

  return { active, setTrail };
});
