import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { StatusMessageComponent } from './status-message.component';
import { ClipboardService } from '@shared/service/clipboard.service';

/**
 * The disclosure that made `status_message` readable.
 *
 * Before this, every screen rendered the message into a `max-w-xs` cell with `truncate`
 * and put the full text in a `title` attribute — so an 1800-character diagnostic naming
 * the filter that failed was recoverable only by hovering a mouse over it, and not at all
 * on touch or by keyboard. These tests hold the three properties that fix costs nothing
 * if they regress and everything if they do: the first clause is always on screen, the
 * rest is reachable without a mouse, and the copy control copies the *whole* message.
 */
describe('StatusMessageComponent (the status_message disclosure)', () => {
  let fixture: ComponentFixture<StatusMessageComponent>;
  let component: StatusMessageComponent;
  let copy: jasmine.Spy;

  const LAMBDA =
    'minor error encountered - lambda filter children_entertainment failed: APIConnectionError: ' +
    'Connection error.; lambda: UserWarning (line 1007): Videos targeted at children not filtered out...';
  const SKIPPED = 'previous task was not executed - previous job 34129 did not succeed';

  beforeEach(async () => {
    copy = jasmine.createSpy('copy').and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [StatusMessageComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: ClipboardService, useValue: { copy } }]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusMessageComponent);
    component = fixture.componentInstance;
  });

  const render = (message: string | null): void => {
    component.statusMessage = message;
    fixture.detectChanges();
  };

  const el = (testId: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  const text = (testId: string): string => (el(testId)?.textContent ?? '').trim();

  // ------------------------------------------------------------------ the split

  describe('the first clause', () => {
    it('is always on screen, with the detail hidden until asked for', () => {
      render(LAMBDA);

      expect(text('status-message-head')).toBe('minor error encountered');
      expect(el('status-message-detail')).withContext('the detail starts collapsed').toBeNull();
    });

    it('is not truncated by CSS — "always visible" has to mean visible', () => {
      render(LAMBDA);

      expect(el('status-message-head')!.className).not.toContain('truncate');
      expect(el('status-message-head')!.className).toContain('break-words');
    });

    it('carries the severity tone it is given', () => {
      component.toneClass = 'text-danger';
      render(LAMBDA);

      expect(el('status-message-head')!.className).toContain('text-danger');
    });

    it('offers no disclosure when the message has no second clause', () => {
      render('done');

      expect(text('status-message-head')).toBe('done');
      expect(el('status-message-toggle')).toBeNull();
    });

    it('renders nothing at all for an absent message — never the literal "null"', () => {
      render(null);

      expect(el('status-message-head')).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('null');
    });
  });

  // ------------------------------------------------------------------ the disclosure

  describe('the disclosure control', () => {
    it('is a real button, so it is keyboard operable without any extra wiring', () => {
      render(LAMBDA);

      const toggle = el('status-message-toggle') as HTMLButtonElement;
      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle.getAttribute('type')).toBe('button');
    });

    it('reports and flips aria-expanded', () => {
      render(LAMBDA);
      const toggle = el('status-message-toggle')!;

      expect(toggle.getAttribute('aria-expanded')).toBe('false');

      toggle.click();
      fixture.detectChanges();

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(component.expanded).toBeTrue();
    });

    it('expands the rest in place, and aria-controls points at it', () => {
      render(LAMBDA);
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      const detail = el('status-message-detail')!;
      expect(detail.textContent).toContain('lambda filter children_entertainment failed');
      expect(detail.textContent).toContain('UserWarning (line 1007)');
      expect(el('status-message-toggle')!.getAttribute('aria-controls')).toBe(detail.id);
      expect(detail.id).toBe(component.disclosureId);
    });

    it('collapses again on a second activation', () => {
      render(LAMBDA);
      el('status-message-toggle')!.click();
      fixture.detectChanges();
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      expect(el('status-message-detail')).toBeNull();
      expect(el('status-message-toggle')!.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not let a click bubble into a clickable row', () => {
      // Bot detail's run rows carry a routerLink; expanding a message there must not
      // navigate away from the list the reader is reading.
      render(LAMBDA);
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      spyOn(event, 'stopPropagation');

      el('status-message-toggle')!.dispatchEvent(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ copy

  describe('the copy control', () => {
    it('copies the WHOLE message, not the visible fragment', async () => {
      render(LAMBDA);

      await component.copy();

      expect(copy).toHaveBeenCalledWith(LAMBDA);
    });

    it('confirms a successful copy and reverts nothing until the timeout', async () => {
      render(LAMBDA);

      await component.copy();
      fixture.detectChanges();

      expect(component.copyLabelKey).toBe('statusMessage.copied');
      expect(text('status-message-copy')).toBe('statusMessage.copied');
    });

    it('says so when the clipboard refused, rather than showing a tick that is a lie', async () => {
      copy.and.returnValue(Promise.resolve(false));
      render(LAMBDA);

      await component.copy();
      fixture.detectChanges();

      expect(component.copyLabelKey).toBe('statusMessage.copyFailed');
    });

    it('does nothing when there is no message to copy', async () => {
      render('');

      await component.copy();

      expect(copy).not.toHaveBeenCalled();
    });

    /**
     * The control's accessible name has to be the label the reader can see change. It used
     * to carry a static `aria-label` ("Copy the full message"), and an `aria-label` always
     * wins over element content — so "Copied" and, far worse, "Copy failed" were rendered
     * and never announced. On the lab box, reached over plain HTTP, a refused copy is a
     * real outcome: the reader pasted nothing and reported the diagnostic as missing.
     */
    it('lets the visible label be the accessible name, so "Copy failed" is announced', async () => {
      copy.and.returnValue(Promise.resolve(false));
      render(LAMBDA);
      const button = el('status-message-copy')!;

      expect(button.getAttribute('aria-label'))
        .withContext('a static aria-label would override the label that actually changes')
        .toBeNull();
      expect(button.getAttribute('title')).toBe('statusMessage.copyFull');

      await component.copy();
      fixture.detectChanges();

      expect(button.textContent!.trim()).toBe('statusMessage.copyFailed');
    });

    it('announces the outcome through a live region rather than silently renaming a button', async () => {
      render(LAMBDA);
      const live = el('status-message-copy-status')!;

      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.textContent!.trim()).withContext('nothing to announce at rest').toBe('');

      await component.copy();
      fixture.detectChanges();

      expect(live.textContent!.trim()).toBe('statusMessage.copied');
    });
  });

  // ------------------------------------------------------------------ the cascade link

  describe('a "previous job <id>" reference', () => {
    it('becomes a link to that job, so the cascade can be walked back', () => {
      render(SKIPPED);
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      const link = el('previous-job-link') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link.textContent!.trim()).toBe('previous job 34129');
      expect(link.getAttribute('href')).toBe('/jobs/behaviors/34129');
    });

    it('leaves the surrounding words as plain text', () => {
      render(SKIPPED);
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      expect(el('status-message-detail')!.textContent).toBe('previous job 34129 did not succeed');
    });

    it('is repointable in one place when a job-detail route exists', () => {
      component.jobLinkPrefix = ['/jobs'];
      render(SKIPPED);
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      expect((el('previous-job-link') as HTMLAnchorElement).getAttribute('href')).toBe('/jobs/34129');
    });

    it('renders no link when the message names no job', () => {
      render('completed with lost jobs - 23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)');
      el('status-message-toggle')!.click();
      fixture.detectChanges();

      expect(el('previous-job-link')).toBeNull();
    });
  });
});
