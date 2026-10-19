import { createI18n } from 'vue-i18n';
import { watch } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import zhCN from './zh-CN';
import enUS from './en-US';

const storageLocale = useLocalStorage('locale', 'zh-CN');

const i18n = createI18n({
  legacy: false,
  locale: storageLocale.value,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
});

watch(i18n.global.locale, (val) => {
  storageLocale.value = val as string;
});

export default i18n;
