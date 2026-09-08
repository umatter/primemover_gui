import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { JobDiagnosticsComponent } from './job-diagnostics.component';
import { Job } from '@app/job/model/Job';
import { ClipboardService } from '@shared/service/clipboard.service';

/**
 * The per-job diagnostics expander.
 *
 * Everything in it was already on every job row the API sends and was rendered nowhere, so
 * answering "when did this run and what did it say" meant leaving the GUI for the runner
 * log. The two things this spec really guards are honesty about the captcha fields:
 * `captcha_found` is a substring match on the page source and is labelled as one, and
 * `captcha_solved` — which the runner has no call site to write, so it is null on every
 * job in the database — is not rendered at all. A field that is always null, displayed,
 * reads as a measurement that came back negative.
 */
describe('JobDiagnosticsComponent', () => {
  let fixture: ComponentFixture<JobDiagnosticsComponent>;
  let component: JobDiagnosticsComponent;
  let copy: jasmine.Spy;

  const job = (over: Partial<Job>): Job => ({ id: 1, name: 'Job', type: 'visitjob', ...over }) as Job;

  beforeEach(async () => {
    copy = jasmine.createSpy('copy').and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [JobDiagnosticsComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: ClipboardService, useValue: { copy } }]
    }).compileComponents();

    fixture = TestBed.createComponent(JobDiagnosticsComponent);
    component = fixture.componentInstance;
  });

  const render = (value: Job | null): void => {
    component.job = value;
    fixture.detectChanges();
  };

  const el = (testId: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  // ------------------------------------------------------------------ the message

  describe('the runner message', () => {
    const MESSAGE =
      'minor error encountered - lambda filter children_entertainment failed: APIConnectionError: Connection error.';

    it('is rendered in full, with no truncation, because that is the point of the drawer', () => {
      render(job({ status_message: MESSAGE }));

      expect(el('diagnostics-message')!.textContent).toBe(MESSAGE);
      expect(el('diagnostics-message')!.className).not.toContain('truncate');
    });

    it('links a "previous job <id>" reference so the cascade can be walked back', () => {
      render(job({ status_message: 'previous task was not executed - previous job 34129 did not succeed' }));

      const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
      expect(link.textContent!.trim()).toBe('previous job 34129');
      expect(link.getAttribute('href')).toBe('/jobs/behaviors/34129');
    });

    it('says the runner recorded nothing rather than showing an empty line', () => {
      render(job({ status_message: null }));

      expect(el('diagnostics-message')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('diagnostics.noMessage');
      expect(fixture.nativeElement.textContent).not.toContain('null');
    });

    it('copies the message', async () => {
      render(job({ status_message: MESSAGE }));

      await component.copy();

      expect(copy).toHaveBeenCalledWith(MESSAGE);
      expect(component.copyLabelKey).toBe('statusMessage.copied');
    });

    /**
     * Same defect, same fix as the status-message control: a static `aria-label` overrode
     * the element's own text, so the only two words that matter — "Copy failed" — existed
     * on screen and nowhere in the accessibility tree.
     */
    it('announces the copy outcome instead of hiding it behind a static aria-label', async () => {
      copy.and.returnValue(Promise.resolve(false));
      render(job({ status_message: MESSAGE }));
      const button = el('diagnostics-copy')!;
      const live = el('diagnostics-copy-status')!;

      expect(button.getAttribute('aria-label')).toBeNull();
      expect(button.getAttribute('title')).toBe('statusMessage.copyFull');
      expect(live.getAttribute('aria-live')).toBe('polite');
      expect(live.textContent!.trim()).toBe('');

      await component.copy();
      fixture.detectChanges();

      expect(button.textContent!.trim()).toBe('statusMessage.copyFailed');
      expect(live.textContent!.trim()).toBe('statusMessage.copyFailed');
    });
  });

  // ------------------------------------------------------------------ timestamps

  describe('the timestamps', () => {
    it('shows both when the API sent them', () => {
      render(job({ started_at: '2026-08-27T09:00:00Z', finished_at: '2026-08-27T09:04:12Z' }));

      expect(component.startedAt).toBe('2026-08-27T09:00:00Z');
      expect(component.finishedAt).toBe('2026-08-27T09:04:12Z');
      expect(fixture.nativeElement.textContent).toContain('2026');
    });

    it('says "not reported" for an absent one rather than leaving a bare dash', () => {
      render(job({ started_at: '2026-08-27T09:00:00Z', finished_at: '' }));

      expect(component.finishedAt).toBe('');
      expect(fixture.nativeElement.textContent).toContain('diagnostics.notReported');
    });
  });

  // ------------------------------------------------------------------ captcha

  describe('captcha_found', () => {
    it('is labelled for what it is: a string seen on the page', () => {
      render(job({ captcha_found: 1 }));

      expect(fixture.nativeElement.textContent).toContain('diagnostics.captchaFound');
      expect(fixture.nativeElement.textContent).toContain('diagnostics.captchaHint');
    });

    it('reads a true value in every shape the column arrives in', () => {
      for (const raw of [true, 1, '1', 'true', 'YES']) {
        render(job({ captcha_found: raw }));
        expect(component.captchaFound).withContext(`captcha_found=${raw}`).toBe('yes');
      }
    });

    it('reads a false value in every shape the column arrives in', () => {
      for (const raw of [false, 0, '0', 'false', 'no']) {
        render(job({ captcha_found: raw }));
        expect(component.captchaFound).withContext(`captcha_found=${raw}`).toBe('no');
      }
    });

    it('is "not reported" when absent — never rounded down to "no"', () => {
      for (const raw of [null, undefined, '']) {
        render(job({ captcha_found: raw }));
        expect(component.captchaFound).withContext(`captcha_found=${raw}`).toBe('unknown');
        expect(el('diagnostics-captcha')!.textContent!.trim()).toBe('diagnostics.captcha.unknown');
      }
    });

    it('is "not reported" for a value it cannot read, rather than a guess', () => {
      render(job({ captcha_found: 'maybe' }));

      expect(component.captchaFound).toBe('unknown');
    });
  });

  /**
   * `JobService.java` has no call site that writes `captcha_solved`; it is null on every
   * job in the live database. Rendering it — as "No", or even as "Not reported" — would
   * imply a signal exists that has simply not arrived for this job. It does not exist.
   */
  describe('captcha_solved', () => {
    it('is not rendered at all, in any state', () => {
      for (const raw of [null, 0, 1, true]) {
        render(job({ captcha_found: 1, captcha_solved: raw }));

        const rendered = fixture.nativeElement.textContent as string;
        expect(rendered).withContext(`captcha_solved=${raw}`).not.toContain('captchaSolved');
        expect(rendered).not.toContain('captcha.solved');
        expect(rendered).not.toContain('Solved');
      }
    });

    it('has no accessor on the component either, so it cannot be bound by accident', () => {
      expect((component as unknown as Record<string, unknown>)['captchaSolved']).toBeUndefined();
    });
  });

  it('renders nothing without a job', () => {
    render(null);

    expect(el('job-diagnostics')).toBeNull();
  });
});
