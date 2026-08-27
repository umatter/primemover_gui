import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NotificationComponent } from './notification.component';

/**
 * A call site that sets a kind and a body but does NOT bind `[error]` -- the job download
 * toast, both upload toasts, the run composer's notices: six of the nine
 * `<app-notification>` instances in the app. Under the old `show` getter (which returned
 * `this.close()`, itself truthy only via `!!this.error`) every one of them was invisible,
 * so a finished download or a failed upload told the user nothing at all.
 */
@Component({
  standalone: true,
  imports: [NotificationComponent],
  template: `
    <app-notification
      [typeSuccess]="true"
      titleText="Download ready"
      [bodyText]="body"
      (closeRequested)="closes = closes + 1"
    ></app-notification>
  `
})
class BodyOnlyHostComponent {
  body = 'experiment-42.zip saved';
  closes = 0;
}

/**
 * A call site that binds `[error]` and sets its kind statically (login, user settings,
 * the global wrapper). These must stay hidden until there really is an error, which is
 * what `errorBound` preserves.
 */
@Component({
  standalone: true,
  imports: [NotificationComponent],
  template: `
    <app-notification [typeError]="true" [error]="error" titleText="Sign in failed" [bodyText]="body">
    </app-notification>
  `
})
class ErrorGatedHostComponent {
  error: { message: string } | null = null;
  body = '';
}

describe('NotificationComponent', () => {
  const toast = (fixture: ComponentFixture<unknown>): HTMLElement | null =>
    fixture.nativeElement.querySelector('[aria-live="assertive"]');

  /**
   * Runs change detection and lets the leave animation finish. The toast is removed by an
   * `*ngIf` behind an `@fadeSlideInOut` trigger, so even under NoopAnimations the element
   * survives one more turn of the microtask queue with `ng-animating` on it.
   */
  const settle = async (fixture: ComponentFixture<unknown>): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent, BodyOnlyHostComponent, ErrorGatedHostComponent, NoopAnimationsModule]
    }).compileComponents();
  });

  describe('a call site that binds no [error]', () => {
    let fixture: ComponentFixture<BodyOnlyHostComponent>;
    let host: BodyOnlyHostComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(BodyOnlyHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders on its kind alone', () => {
      expect(toast(fixture)).not.toBeNull();
      expect(toast(fixture)!.textContent).toContain('Download ready');
      expect(toast(fixture)!.textContent).toContain('experiment-42.zip saved');
    });

    // The other half of the old getter bug: `show` called `close()`, so merely rendering
    // the component emitted an @Output from inside change detection -- an
    // ExpressionChangedAfterItHasBeenChecked / repeated-emit hazard, and a toast that
    // told its parent it had been dismissed without anyone clicking anything.
    it('emits nothing from change detection alone', () => {
      fixture.detectChanges();
      fixture.detectChanges();
      host.body = 'a new message';
      fixture.detectChanges();

      expect(host.closes).toBe(0);
      expect(toast(fixture)).not.toBeNull();
    });

    it('emits exactly once, and hides, when the close button is clicked', async () => {
      (fixture.nativeElement.querySelector('app-notification button') as HTMLButtonElement).click();
      await settle(fixture);

      expect(host.closes).toBe(1);
      expect(toast(fixture)).toBeNull();
    });
  });

  describe('a call site that binds [error]', () => {
    let fixture: ComponentFixture<ErrorGatedHostComponent>;
    let host: ErrorGatedHostComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(ErrorGatedHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('stays hidden while the bound error is null', () => {
      expect(toast(fixture)).toBeNull();
    });

    it('appears once an error arrives', () => {
      host.error = { message: 'The user credentials were incorrect.' };
      host.body = host.error.message;
      fixture.detectChanges();

      expect(toast(fixture)).not.toBeNull();
      expect(toast(fixture)!.textContent).toContain('The user credentials were incorrect.');
    });

    it('re-shows itself for a new error after the last one was dismissed', async () => {
      host.error = { message: 'first' };
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('app-notification button') as HTMLButtonElement).click();
      await settle(fixture);
      expect(toast(fixture)).toBeNull();

      host.error = { message: 'second' };
      fixture.detectChanges();
      expect(toast(fixture)).not.toBeNull();
    });
  });

  describe('without any kind', () => {
    it('renders nothing -- a notification with no error/success/info is not a notification', () => {
      const fixture = TestBed.createComponent(NotificationComponent);
      fixture.componentRef.setInput('bodyText', 'orphan');
      fixture.detectChanges();

      expect(toast(fixture)).toBeNull();
    });
  });
});
