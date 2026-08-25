import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  invalidLocalStorageTokenFound,
  noLocalStorageTokenFound,
  redirectToHomeRequested,
  signInRequested,
  useTokenFromLocalStorageRequested
} from '../../../store/auth/auth.actions';
import { LocalStorageService } from '../../services/local-storage.service';
import { TokenService } from '../../services/token.service';
import { selectAccessToken, selectErrorResponse } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [NotificationComponent, ReactiveFormsModule, TranslateModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  form: UntypedFormGroup;
  /** The failed sign-in to display, or null once dismissed / on a new attempt. */
  error: { message: string } | null = null;
  errorResponse$: Observable<any>;

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    private router: Router,
    private store: Store,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.errorResponse$ = this.store.select(selectErrorResponse);

    this.errorResponse$.subscribe((response) => {
      if (Boolean(response?.error)) {
        // Passport answers wrong credentials with 400 invalid_grant and a
        // `message`; a network failure has no usable body, hence the fallback.
        this.error = { message: response?.message || 'Sign in failed. Please try again.' };
        // OnPush: a value set from a subscription is not picked up on its own.
        this.cdr.markForCheck();
      }
    });

    const accessToken = this.localStorageService.get('accessToken');

    if (!accessToken) {
      this.store.dispatch(noLocalStorageTokenFound());
    }

    if (!this.tokenService.isTokenValid(accessToken)) {
      this.store.dispatch(invalidLocalStorageTokenFound({ token: accessToken }));
    }

    if (this.tokenService.isTokenValid(accessToken)) {
      this.store.dispatch(useTokenFromLocalStorageRequested({ token: accessToken }));
    }

    this.store.select(selectAccessToken).subscribe((validTokenFound) => {
      if (Boolean(validTokenFound)) {
        this.store.dispatch(redirectToHomeRequested());
        this.router.navigateByUrl('experiments').then();
      }
    });
  }

  onSubmit() {
    this.error = null;
    const username = this.form.get('username')?.value;
    const password = this.form.get('password')?.value;
    this.store.dispatch(signInRequested({ username: username, password: password }));
  }
}
