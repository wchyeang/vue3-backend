import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'ant-design-vue';
import { useAuthStorage } from '@/composables/useAuthStorage';
import type { ApiResponse } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REFRESH_URL = '/auth/refresh';

// 无需携带 / 触发刷新的白名单请求
const WHITE_LIST = ['/auth/login', '/auth/refresh'];

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
});

let isRefreshing = false;
let waitingQueue: Array<(token: string) => void> = [];

// 刷新失败回调，默认清空 token；auth store 会注册执行登出跳转
let onRefreshFail = () => {
  useAuthStorage().clearTokens();
};

export function setRefreshFailHandler(fn: () => void) {
  onRefreshFail = fn;
}

function isInWhiteList(url?: string) {
  if (!url) return false;
  return WHITE_LIST.some((path) => url.includes(path));
}

// 请求拦截器：白名单外自动注入 accessToken
instance.interceptors.request.use((config) => {
  if (isInWhiteList(config.url)) return config;
  const token = useAuthStorage().getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 真正刷新 token 的独立请求，避免复用拦截器再次触发刷新
async function doRefresh() {
  const refreshToken = useAuthStorage().getRefreshToken();
  if (!refreshToken) {
    throw new Error('no refresh token');
  }
  const { data } = await axios.post<ApiResponse<TokenPairPayload>>(
    `${BASE_URL}${REFRESH_URL}`,
    { refreshToken }
  );
  if (data.code !== 0) {
    throw new Error(data.message);
  }
  useAuthStorage().setAccessToken(data.data.accessToken);
  useAuthStorage().setRefreshToken(data.data.refreshToken);
  return data.data.accessToken;
}

// 单次刷新 + 等待队列重放
function retryAfterRefresh(config: AxiosRequestConfig) {
  if (!isRefreshing) {
    isRefreshing = true;
    doRefresh()
      .then((token) => {
        waitingQueue.forEach((cb) => cb(token));
        waitingQueue = [];
      })
      .catch(() => onRefreshFail())
      .finally(() => {
        isRefreshing = false;
      });
  }

  return new Promise((resolve) => {
    waitingQueue.push((token) => {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      resolve(instance(config));
    });
  });
}

function handleBusinessError(code: number, error: Error) {
  if (typeof window !== 'undefined') {
    message.error(error.message || '请求失败');
  }
  void code;
}

// 响应拦截器：统一业务码处理 + 401 自动刷新
instance.interceptors.response.use(
  (response) => {
    const apiData = response.data as ApiResponse;
    const config = response.config;
    if (apiData.code === 0) {
      return apiData.data as unknown as AxiosResponse;
    }
    // token 失效：进入刷新重试流程
    if (apiData.code === 401 && !isInWhiteList(config.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    handleBusinessError(apiData.code, new Error(apiData.message));
    return Promise.reject(new Error(apiData.message));
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    // HTTP 401 同样走刷新重试
    if (status === 401 && !isInWhiteList(config?.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    handleBusinessError(status, error);
    return Promise.reject(error);
  }
);

interface TokenPairPayload {
  accessToken: string;
  refreshToken: string;
}

// 泛型请求封装：直接返回业务数据
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config) as Promise<T>;
}

export function get<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ url, method: 'GET', params });
}

export function post<T>(url: string, data?: unknown) {
  return request<T>({ url, method: 'POST', data });
}

export function put<T>(url: string, data?: unknown) {
  return request<T>({ url, method: 'PUT', data });
}

export function del<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ url, method: 'DELETE', params });
}

export default instance;
