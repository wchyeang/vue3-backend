import { useStorage } from '@vueuse/core';

const accessToken = useStorage<string>('accessToken', '');
const refreshToken = useStorage<string>('refreshToken', '');

export function useAuthStorage() {
  return {
    getAccessToken: () => accessToken.value,
    setAccessToken: (value: string) => {
      accessToken.value = value;
    },
    getRefreshToken: () => refreshToken.value,
    setRefreshToken: (value: string) => {
      refreshToken.value = value;
    },
    clearTokens: () => {
      accessToken.value = '';
      refreshToken.value = '';
    }
  };
}
