import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStorage } from '@/composables/useAuthStorage';
import { authApi } from '@/api/auth';
import { setRefreshFailHandler } from '@/api/http';
import type { LoginParams, UserInfo } from '@/types/api';

export const useAuthStore = defineStore('auth', () => {
  const authStorage = useAuthStorage();
  const userInfo = ref<UserInfo | null>(null);

  const isAuthenticated = computed(() => !!authStorage.getAccessToken());

  const router = useRouter();

  async function login(params: LoginParams) {
    const result = await authApi.login(params);
    authStorage.setAccessToken(result.accessToken);
    authStorage.setRefreshToken(result.refreshToken);
    userInfo.value = result.userInfo;
  }

  function logout() {
    authStorage.clearTokens();
    userInfo.value = null;
    router.push('/login');
  }

  // 刷新失败（refreshToken 也失效）时由 http 层触发登出
  setRefreshFailHandler(logout);

  return { userInfo, isAuthenticated, login, logout };
});
