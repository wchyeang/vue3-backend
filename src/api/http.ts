import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStorage } from '@/composables/useAuthStorage';
import { AppError, ErrorCode } from '@/types/error';
import type { ErrorKind } from '@/types/error';
import type { ApiResponse } from '@/types/api';
import i18n from '@/locales';

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
    throw new AppError(data.message || '登录已失效', data.code, 'business');
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

/** 抛出分类后的 AppError，消息由全局兜底按 locale 解析展示 */
function throwAppError(code: number, serverMessage?: string, kind: ErrorKind = 'unknown'): never {
  throw new AppError(serverMessage || '', code, kind, kind === 'http' ? code : undefined);
}

/** 按 locale 解析 AppError 的展示消息，优先走 i18n 按错误码映射，其次使用后端消息 */
function resolveErrorMessage(error: AppError): string {
  if (error.kind === 'business') {
    const key = `error.business.${error.code}`;
    const mapped = i18n.global.t(key);
    if (mapped !== key) return mapped;
    return error.message || i18n.global.t('error.unknown');
  }
  if (error.kind === 'network') return i18n.global.t('error.network');
  if (error.kind === 'http' && error.httpStatus != null) {
    const key = `error.http.${error.httpStatus}`;
    const mapped = i18n.global.t(key);
    if (mapped !== key) return mapped;
    if (error.httpStatus >= 500) return i18n.global.t('error.serviceUnavailable');
    return i18n.global.t('error.unknown');
  }
  return error.message || i18n.global.t('error.unknown');
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
    if (apiData.code === ErrorCode.AUTH_TOKEN_EXPIRED && !isInWhiteList(config.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    throwAppError(apiData.code, apiData.message, 'business');
  },
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    // HTTP 401 同样走刷新重试
    if (status === 401 && !isInWhiteList(config?.url)) {
      return retryAfterRefresh(config) as unknown as Promise<AxiosResponse>;
    }
    // 网络错误 — 无任何响应
    if (!error.response) {
      throw new AppError(i18n.global.t('error.network'), 0, 'network');
    }
    throwAppError(status ?? 0, error.response?.data?.message, 'http');
  }
);

// 全局兜底：对所有 AppError 按 locale 解析并弹窗
instance.interceptors.response.use(undefined, (error) => {
  if (error instanceof AppError) {
    import('ant-design-vue').then(({ message }) => {
      setTimeout(() => message.error(resolveErrorMessage(error)), 100);
    });
  }
  return Promise.reject(error);
});

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
