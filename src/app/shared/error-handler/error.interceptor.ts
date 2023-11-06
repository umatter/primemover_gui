import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, EMPTY, Observable, retry, throwError, timer } from 'rxjs';
import { CONTEXT, InterceptorContext } from './http-context';
import { ErrorService, IErrorService } from './error.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private errorService: IErrorService;
  private httpContext!: InterceptorContext;

  constructor(private injector: Injector) {
    this.errorService = this.injector.get(ErrorService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.httpContext = request.context.get(CONTEXT);

    return next.handle(request).pipe(
      retry({
        count: this.httpContext.retryConfig.count,
        delay: (_, count) => timer(count * this.httpContext.retryConfig.delayTime)
      }),
      catchError(async (response) => this.handle(response))
    );
  }

  private async handle(response: any): Promise<any> {
    //console.log('ErrorInterceptor', response);
    const error = await this.getError(response);
    this.errorService.handle(error);

    return throwError(() => (this.httpContext.rethrow ? response : EMPTY));
  }

  private getError(response: any): Promise<any> {
    if (this.isBlobResponse(response)) {
      return this.getErrorFromBlob(response);
    }

    if (this.isArrayBufferResponse(response)) {
      return this.getErrorArrayBuffer(response);
    }

    return Promise.resolve(response);
  }

  private getErrorFromBlob(response: any): Promise<any> {
    // https://github.com/angular/angular/issues/19888
    // When request of type Blob, the error is also in Blob instead of object of the json data
    return new Promise<any>((resolve, _) => {
      let reader = new FileReader();
      reader.onload = (e: Event) => {
        try {
          const errorMessage = JSON.parse((<any>e.target).result);
          resolve(new HttpErrorResponse({ ...response, error: errorMessage }));
        } catch (e) {
          resolve(response);
        }
      };
      reader.onerror = () => resolve(response);
      reader.readAsText(response.error);
    });
  }

  private getErrorArrayBuffer(response: any): Promise<any> {
    let error = Promise.resolve(response);

    if (response instanceof HttpErrorResponse) {
      new HttpErrorResponse({
        ...response,
        error: JSON.parse(String.fromCharCode.apply(null, new Uint8Array(response.error)))
      });
    }

    return Promise.resolve(error);
  }

  private isBlobResponse(response: any): boolean {
    if (!(response instanceof HttpErrorResponse)) {
      return false;
    }

    if (!(response?.error instanceof Blob)) {
      return false;
    }

    return response?.error?.type === 'application/json';
  }

  private isArrayBufferResponse(response: any): boolean {
    if (!(response instanceof HttpErrorResponse)) {
      return false;
    }

    return response?.error instanceof ArrayBuffer;
  }
}
