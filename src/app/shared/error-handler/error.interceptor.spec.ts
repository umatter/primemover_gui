import { TestBed } from '@angular/core/testing';
import { ErrorInterceptor } from './error.interceptor';
import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import objectContaining = jasmine.objectContaining;

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let gatewayUrl: string = '/api/v1/endpoint';
  let baseUrl: string = 'https://example.com';
  let mockHandler = {
    handle: (request: HttpRequest<any>): Observable<HttpEvent<unknown>> => of(new HttpResponse(request))
  };
  let errorResponse = new HttpErrorResponse({
    error: { code: `Error code`, message: `Error message.` },
    status: 400,
    statusText: 'Bad Request'
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ErrorInterceptor,
        {
          multi: true,
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor
        }
      ]
    });
    interceptor = TestBed.inject(ErrorInterceptor);
  });

  it('should be created', () => {
    const interceptor: ErrorInterceptor = TestBed.inject(ErrorInterceptor);
    expect(interceptor).toBeTruthy();
  });

  it('should return url containing base url to the handler', (done) => {
    let spy = spyOn(mockHandler, 'handle').and.callThrough();

    interceptor.intercept(new HttpRequest('GET', baseUrl + gatewayUrl), mockHandler).subscribe(() => {
      expect(spy).toHaveBeenCalledWith(
        objectContaining({
          url: baseUrl + gatewayUrl
        })
      );
      done();
    });
    expect(interceptor).toBeTruthy();
  });

  it('should return error in case of failure', (done) => {
    interceptor
      .intercept(new HttpRequest('GET', baseUrl + gatewayUrl), mockHandler)
      .pipe(
        catchError((error) => {
          expect(error).toEqual(errorResponse);
          return of(error);
        })
      )
      .subscribe(() => done())
      .unsubscribe();
    expect(interceptor).toBeTruthy();
  });
});
