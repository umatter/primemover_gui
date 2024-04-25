import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { logoutRequested } from '../../store/auth/auth.actions';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private store: Store
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error) => {
        // Ignore non-401 errors in this interceptor
        if (!request.url.includes('/auth/token') || error.status === 401) {
          //this.store.dispatch(logoutRequested())
          //this.router.navigateByUrl('/login').then(r => console.log(r));
        }

        return throwError(error);
      })
    );
  }
}
