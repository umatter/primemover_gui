import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AuthService } from '../services/auth.service';
import { selectAccessToken } from '@app/store/auth/auth.selectors';
import {
  authGuardPassed,
  redirectToLoginRequested,
  updateLocalStorageTokenRequested,
  updateUserRequested,
  User,
  useTokenFromLocalStorageRequested,
  validLocalStorageTokenFound,
  validLocalTokenFound
} from '@app/store/auth/auth.actions';
import { LocalStorageService } from '../services/local-storage.service';
import { TokenService } from '../services/token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  accessToken$: Observable<any>;
  accessToken: any;

  constructor(
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
  ) {}

  canActivate(next: ActivatedRouteSnapshot, { url }: RouterStateSnapshot): Observable<boolean> | boolean {
    const requiresLogin = next.data['requiresLogin'] || false;
    if (!requiresLogin) {
    }
    this.accessToken$ = this.store.select(selectAccessToken);

    if (!this.hasValidToken()) {
      this.store.dispatch(redirectToLoginRequested());
      this.router.navigateByUrl('/').then(() => of(null));
      return false;
    }

    // update user?
    this.store.dispatch(authGuardPassed());
    return true;
  }

  updateUser(): void {
    this.authService.user().pipe(
      map((user: User) => {
        this.store.dispatch(updateUserRequested({ user: user }));

        return true;
      }),
      catchError(() => of(false))
    );
  }

  hasValidToken(): boolean {
    if (this.isLocalStorageTokenValid()) {
      return true;
    }

    return this.isLocalTokenValid();
  }

  getLocalStorageToken(): string | null {
    return this.localStorageService.get('accessToken');
  }

  getLocalToken(): string {
    this.store.pipe(select(selectAccessToken)).subscribe((response) => (this.accessToken = response));
    return this.accessToken;
  }

  isLocalTokenValid(): boolean {
    const jwtToken = this.getLocalToken();
    if (this.tokenService.isTokenValid(jwtToken)) {
      this.store.dispatch(validLocalTokenFound());
      this.updateLocalStorageToken(jwtToken);
      return true;
    }
    return false;
  }

  isLocalStorageTokenValid(): boolean {
    const jwtToken = this.getLocalStorageToken();
    if (this.tokenService.isTokenValid(jwtToken)) {
      this.store.dispatch(validLocalStorageTokenFound());
      this.store.dispatch(useTokenFromLocalStorageRequested({ token: jwtToken }));
      return true;
    }
    return false;
  }

  getToken(): string {
    return this.getLocalStorageToken() ?? this.getLocalToken();
  }

  updateLocalStorageToken(jwtToken: string) {
    this.localStorageService.set('accessToken', jwtToken);
    this.store.dispatch(updateLocalStorageTokenRequested());
  }
}
