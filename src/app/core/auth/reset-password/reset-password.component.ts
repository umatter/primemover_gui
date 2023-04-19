import { Component, OnInit } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { catchError, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  animations: [fadeIn]
})
export class ResetPasswordComponent implements OnInit {

  form: UntypedFormGroup;
  autocomplete = new FormControl('', [Validators.required]);
  message: string;
  errorResponse$: Observable<any>;
  token: string | null;
  email: string;
  isLoading: boolean;
  hasErrorResponse: boolean;

  constructor(
    private service: AuthService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute
    ) {
    this.form = this.fb.group({
      password: [null, [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/),
        Validators.pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
      ]],
      confirmPassword: [null, [Validators.required]],
    });

    this.token = this.route.snapshot.paramMap.get('token');
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'];
    });

  }

  ngOnInit(): void {
    if (!this.token || !this.email){
      this.router.navigateByUrl('/').then();
    }
  }

  notMatchPassworError(): boolean {
    if (this.form.get('confirmPassword')?.touched)
      return this.form.get('password')?.value !== this.form.get('confirmPassword')?.value;
    
    return false
  }
  
  hasError(controlName: string,errorName: string): boolean {
    return (
      this.form.get(controlName)?.touched &&
      this.form.get(controlName)?.invalid &&
      this.form.get(controlName)?.getError(errorName)
    )
  }

  autoCompleteHasError(errorName: string) {
    return (
      this.autocomplete?.touched &&
      this.autocomplete?.invalid &&
      this.autocomplete.getError(errorName)
    )
  }

  onSubmit() {
    const password = this.form.get('password')?.value;
    const password_confirmation = this.form.get('confirmPassword')?.value;

    this.isLoading = true;

    this.service.resetPassword(this.token, this.email, password, password_confirmation)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.hasErrorResponse = true;
            this.message = error.error.message
            this.isLoading = false;
            return [];
          })
        )
        .subscribe((response) => {
        this.router.navigateByUrl('/').then()
        this.isLoading = false;
      })
  }
}
