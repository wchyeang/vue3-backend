import { watch } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';

export const useThemeStore = defineStore('theme', () => {
  const isDark = useLocalStorage<boolean>('theme', false, {
    serializer: {
      read: (raw) => raw === 'dark',
      write: (val) => (val ? 'dark' : 'light'),
    },
  });

  function toggleTheme() {
    isDark.value = !isDark.value;
  }

  watch(
    isDark,
    (val) => {
      document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light');
    },
    { immediate: true }
  );

  return { isDark, toggleTheme };
});
