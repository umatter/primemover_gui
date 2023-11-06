import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export declare interface IErrorService {
  handle(error: any): Observable<never>;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements IErrorService {
  error$ = new BehaviorSubject<HttpErrorResponse | null>(null);

  handle(error: any): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      this.handleHttp(error);
    }

    throw error;
  }

  protected factory(error: any): HttpErrorResponse {
    return new HttpErrorResponse({
      ...error,
      status: error?.error?.code || error?.status || 503,
      statusText: error?.error?.message || error?.message || error?.statusText || 'Unknown error'
    });
  }

  protected handleHttp(error: any) {
    let response = this.factory(error);
    this.error$.next(response);
    throw response;
  }
}
