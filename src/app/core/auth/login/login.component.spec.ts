import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LoginComponent } from './login.component';
import { AuthState, initialState } from '../../../store/auth/auth.reducer';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore<{ auth: AuthState }>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideMockStore({ initialState: { auth: initialState } })
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const notification = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('app-notification [aria-live]');

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows nothing before a sign-in attempt', () => {
    expect(notification()).toBeNull();
  });

  // Passport rejects bad credentials with 400 invalid_grant, not 401. This used
  // to be swallowed: the notification's `error` input was never bound, and the
  // component is OnPush, so the failure never reached the screen.
  it('shows the API message when sign-in fails', () => {
    store.setState({
      auth: { ...initialState, response: { error: 'invalid_grant', message: 'The user credentials were incorrect.' } }
    });
    fixture.detectChanges();

    expect(notification()?.textContent).toContain('The user credentials were incorrect.');
  });

  it('falls back to a generic message when the failure has no body', () => {
    store.setState({ auth: { ...initialState, response: { error: new ProgressEvent('error') } } });
    fixture.detectChanges();

    expect(notification()?.textContent).toContain('Sign in failed');
  });

  it('hides the notification when dismissed', () => {
    store.setState({ auth: { ...initialState, response: { error: 'invalid_grant', message: 'nope' } } });
    fixture.detectChanges();
    expect(notification()).not.toBeNull();

    component.error = null;
    fixture.detectChanges();
    expect(notification()).toBeNull();
  });
});
