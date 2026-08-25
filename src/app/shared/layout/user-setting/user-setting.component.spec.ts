import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { UserSettingComponent } from './user-setting.component';
import { AppConfig } from '@app/app-config';

describe('UserSettingComponent', () => {
  let fixture: ComponentFixture<UserSettingComponent>;
  let component: UserSettingComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfig, useValue: { apiBaseUrl: '/api/v1' } }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UserSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const fill = (current: string, next: string, confirm = next) => {
    component.form.setValue({ currentPassword: current, password: next, confirmPassword: confirm });
    component.form.markAllAsTouched();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('applies the API password rule before submitting', () => {
    fill('Old-pass1', 'weak');
    expect(component.form.invalid).toBeTrue();
    component.onSubmit();
    http.expectNone('/api/v1/auth/change-password');
  });

  it('blocks a mismatched confirmation', () => {
    fill('Old-pass1', 'Strong-pass1', 'Strong-pass2');
    expect(component.passwordsDiffer()).toBeTrue();
    component.onSubmit();
    http.expectNone('/api/v1/auth/change-password');
  });

  it('posts current + new password and reports success', () => {
    fill('Old-pass1', 'Strong-pass1');
    component.onSubmit();

    const req = http.expectOne('/api/v1/auth/change-password');
    expect(req.request.body).toEqual({
      current_password: 'Old-pass1',
      password: 'Strong-pass1',
      password_confirmation: 'Strong-pass1'
    });
    req.flush({ message: 'Password changed.' });

    expect(component.outcome?.success).toBeTrue();
    expect(component.form.value.password).toBeNull();
  });

  it('surfaces the API message when the current password is wrong', () => {
    fill('wrong', 'Strong-pass1');
    component.onSubmit();

    http
      .expectOne('/api/v1/auth/change-password')
      .flush({ message: 'The password is incorrect.' }, { status: 422, statusText: 'Unprocessable' });

    expect(component.outcome).toEqual({ success: false, message: 'The password is incorrect.' });
    expect(component.isLoading).toBeFalse();
  });
});
