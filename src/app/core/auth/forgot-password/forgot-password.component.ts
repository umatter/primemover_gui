import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from '@app/core/services/auth.service';
import { selectErrorResponse } from '@app/store/auth/auth.selectors';
import { Store } from '@ngrx/store';
import { catchError, Observable } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit {
  form: UntypedFormGroup;
  hasError: boolean;
  message: string;
  errorResponse$: Observable<any>;
  isLoading: Boolean;
  typeSuccess: boolean;

  constructor(private fb: UntypedFormBuilder, private store: Store, private service: AuthService) {
    this.form = this.fb.group({
      email: [null, [Validators.required]]
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
  }

  onSubmit() {
    const email = this.form.get('email')?.value;

    this.isLoading = true;
    this.service
      .forgotPassword(email)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.hasError = true;
          this.message = error.error.message;
          this.isLoading = false;
          this.form.reset();
          return [];
        })
      )
      .subscribe((response) => {
        this.typeSuccess = true;
        this.message = response.message;
        this.isLoading = false;
        this.form.reset();
      });
  }
}
