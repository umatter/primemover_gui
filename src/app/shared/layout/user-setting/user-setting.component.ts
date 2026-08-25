import { ChangeDetectorRef, Component } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { fadeIn } from '@shared/animation/trigger';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, TranslateModule, NotificationComponent, LoadingSpinnerComponent],
  animations: [fadeIn]
})
export class UserSettingComponent {
  form: UntypedFormGroup;
  isLoading = false;
  /** Outcome of the last submit, or null. Drives the notification. */
  outcome: { success: boolean; message: string } | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    // Same rule as the reset-password page and the API:
    // 8+, one uppercase, one digit, one special character.
    this.form = this.fb.group({
      currentPassword: [null, [Validators.required]],
      password: [
        null,
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[0-9]/),
          Validators.pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
        ]
      ],
      confirmPassword: [null, [Validators.required]]
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.form.get(controlName);
    return Boolean(c?.touched && c?.invalid && c?.getError(errorName));
  }

  passwordsDiffer(): boolean {
    const confirm = this.form.get('confirmPassword');
    return Boolean(confirm?.touched && confirm.value !== this.form.get('password')?.value);
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordsDiffer()) {
      return;
    }

    this.isLoading = true;
    this.outcome = null;

    this.auth
      .changePassword(
        this.form.get('currentPassword')?.value,
        this.form.get('password')?.value,
        this.form.get('confirmPassword')?.value
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // Laravel's 422 carries the first failing rule in `message`
          // ("The password is incorrect.", "The password format is invalid.").
          this.outcome = { success: false, message: error.error?.message ?? 'Password change failed.' };
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response) {
          this.outcome = { success: true, message: '' };
          this.form.reset();
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }
}
