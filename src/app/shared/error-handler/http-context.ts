import { HttpContext, HttpContextToken } from '@angular/common/http';

interface RetryConfig {
  count: number;
  delayTime: number;
}

export interface InterceptorContext {
  retryConfig: RetryConfig;
  rethrow: boolean;
}

export const CONTEXT: HttpContextToken<InterceptorContext> = new HttpContextToken(() => ({
  retryConfig: {
    count: 1,
    delayTime: 1000
  },
  rethrow: true
}));

export const httpContext = new HttpContext().set(CONTEXT, CONTEXT.defaultValue());
