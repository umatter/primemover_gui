import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  useTokenFromLocalStorageRequested,
  invalidLocalStorageTokenFound,
  noLocalStorageTokenFound,
  signInRequested,
  redirectToHomeRequested
} from '../../../store/auth/auth.actions';
import { LocalStorageService } from '../../services/local-storage.service';
import { TokenService } from '../../services/token.service';
import { selectAccessToken, selectErrorResponse } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {
  form: UntypedFormGroup;
  hasError: boolean;
  message: string;
  errorResponse$: Observable<any>;

  constructor(
    private fb: UntypedFormBuilder,
    private http: HttpClient,
    private router: Router,
    private store: Store,
    private localStorageService: LocalStorageService,
    private tokenService: TokenService
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
        this.hasError = true;
        this.message = response?.message;
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
    const username = this.form.get('username')?.value;
    const password = this.form.get('password')?.value;
    this.store.dispatch(signInRequested({ username: username, password: password }));
  }
}
