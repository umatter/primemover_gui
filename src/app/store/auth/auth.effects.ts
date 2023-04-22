import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AuthService } from '../../core/services/auth.service';
import {
  fetchUserDataFailed,
  fetchUserDataSuccess,
  missingCredentialsPassword,
  missingCredentialsUsername,
  signInCompleted,
  signInFailed,
  signInRequested
} from './auth.actions';
import { catchError, exhaustMap, map, switchMap, tap } from 'rxjs';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../core/services/local-storage.service';

@Injectable()
export class AuthEffects {
  signInRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signInRequested),
      switchMap(({ username, password }) => {
        if (!username) {
          return of(missingCredentialsUsername());
        }
        if (!password) {
          return of(missingCredentialsPassword());
        }

        return this.authService.createToken(username, password).pipe(
          tap((response) => this.localStorageService.set('accessToken', response.access_token)),
          map((response) => signInCompleted({ token: response.access_token })),
          catchError((error) => of(signInFailed(error)))
        )
      })
    )
  );

  signInCompleted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signInCompleted),
      switchMap(() =>
        this.authService.user().pipe(
          tap((user) => this.localStorageService.set('user', JSON.stringify(user))),
          map((user) => fetchUserDataSuccess({ user })),
          catchError((error) => of(fetchUserDataFailed({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private authService: AuthService,
    private router: Router,
    private localStorageService: LocalStorageService
  ) {}
}
