/** 错误来源 */
export type ErrorKind = 'network' | 'http' | 'business' | 'unknown';

/** 业务错误码 */
export const ErrorCode = {
  SUCCESS: 0,
  AUTH_WRONG_CREDENTIALS: 40101,
  AUTH_ACCOUNT_LOCKED: 40102,
  AUTH_TOKEN_EXPIRED: 40103,
  AUTH_REFRESH_EXPIRED: 40104,
  FORBIDDEN: 40301,
  VALIDATION_ERROR: 42201,
  RATE_LIMITED: 42901,
  SERVER_ERROR: 50001,
} as const;

export class AppError extends Error {
  readonly code: number;
  readonly kind: ErrorKind;
  readonly httpStatus?: number;

  constructor(
    message: string,
    code: number,
    kind: ErrorKind = 'unknown',
    httpStatus?: number,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.kind = kind;
    this.httpStatus = httpStatus;
  }

  get isAuthError(): boolean {
    return this.code >= 40101 && this.code <= 40199;
  }

  get isSystemError(): boolean {
    return this.kind === 'network' || (this.kind === 'http' && this.code >= 500);
  }
}
