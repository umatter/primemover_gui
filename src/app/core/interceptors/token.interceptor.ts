import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectAccessToken } from '../../store/auth/auth.selectors';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private store: Store) {}
  accessToken: any;

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
