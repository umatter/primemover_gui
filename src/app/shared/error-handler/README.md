# Angular error interceptor with global handler

This interceptor can be used to handle HTTP errors globally. It will catch all errors and pass them to the error
handler. The error handler can have custom implementation. The default implementation will log the error to the console.

## Requirements

In order to use this interceptor, you need to add it to the providers array in the app.module.ts file.

```typescript
import { AppComponent } from './app.component';
import { ErrorHandler, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorInterceptor } from './interceptor/error.interceptor';
import { GlobalErrorHandler } from './interceptor/handler.service';

@NgModule({
  declarations: [AppComponent],
  imports: [],
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler // <- Or just implement your own ErrorHandler
    },
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

## Custom error handler implementation

Implement your own error handling e.g.

1. Log error
2. Show error notification
3. Navigate to error pages based on code/status
4. Dispatch ngrx action

```typescript
import { ErrorHandler, Injectable } from '@angular/core';
import { EMPTY } from 'rxjs';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any) {
    // Implementation goes here
    return EMPTY;
  }
}
```

## Default ErrorService

Usually an http error comes from a stream because of async call. Such an error will not be handled by the error handler.
That is because of ngZone.run(). The default error service will handle all http errors from a stream and just throw an
error that can be handled by the
global error handler. However, the default error service will handle errors that are from a stream but also errors that
are not.

```typescript
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export declare interface IErrorService {
  handle(error: any): Observable<never>;
}

export class ErrorService implements IErrorService {
  handle(error: any): Observable<never> {
    return throwError(() => error);
  }
}
```

## Implement your own ErrorService

In case you want to handle errors differently, you can implement your own error service.

```typescript
export declare interface IErrorService {
  handle(error: any): Observable<never>;
}
```

## Http context

The error interceptor will pass the http context to the error handler. The http context contains thed request and
response.

```typescript
import { HttpContext, HttpContextToken } from '@angular/common/http';

interface RetryConfig {
  count: number;
  delayTime: number;
  resetOnSuccess: boolean;
}

export interface InterceptorContext {
  retryConfig: RetryConfig;
  rethrow: boolean;
}

export const CONTEXT: HttpContextToken<InterceptorContext> = new HttpContextToken(() => ({
  retryConfig: {
    count: 1,
    delayTime: 1000,
    resetOnSuccess: true
  },
  rethrow: true
}));

export const defaultHttpContext = new HttpContext().set(CONTEXT, CONTEXT.defaultValue());
```

## Example

If you intend to use the error interceptor with custom retry config, you need to pass the http context to the request.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { defaultHttpContext } from '../interceptor/http-context';

export class PostService {
  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts', {
      context: defaultHttpContext
    });
  }
}
```
