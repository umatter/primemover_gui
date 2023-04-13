import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectAccessToken } from '@app/store/auth/auth.selectors';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  accessToken: any;

  constructor(private store: Store) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.store.pipe(select(selectAccessToken)).subscribe((response) => (this.accessToken = response));
    if (this.accessToken && !req.url.includes('auth/token')) {
      const tokenHeader = 'Bearer ' + this.accessToken;

      req = req.clone({
        setHeaders: {
          Authorization: tokenHeader
        }
      });
    }

    return next.handle(req);
  }
}
