import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layout/MainLayout.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'LoginPage',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'HomePage',
          component: () => import('@/views/Home.vue')
        },
        {
          path: ':pathMatch(.*)*',
          name: 'NotFound',
          component: () => import('@/views/NotFound.vue')
        }
      ]
    }
  ]
});

router.beforeEach((to, _from) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login';
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    return '/';
  }
});

export default router;
