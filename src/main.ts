import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

import './styles/tokens.css';
import './styles/responsive.css';

import App from './App.vue';
import router from './router';
import i18n from './locales';

async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledFrame: 'bypass' });
  }
}

enableMocking().then(() => {
  const app = createApp(App);

  app.use(createPinia());
  app.use(router);
  app.use(i18n);
  app.use(Antd);

  app.mount('#app');
});
