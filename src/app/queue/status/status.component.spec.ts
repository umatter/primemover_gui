import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { StatusComponent } from './status.component';
import {
  isBadStatus,
  isCanonicalStatus,
  normalizeStatus,
  QueueStatusEnum,
  STATUS_ALIASES,
  statusOrUnknown,
  UNKNOWN_STATUS
} from './status.enum';

/**
 * The shared status pill is the leaf every screen renders a job or run state through, and
 * until now it had **zero executing coverage**: its spec was an auto-generated stub that
 * did not compile (`declarations: [StatusComponent]` for a standalone component) and sat
 * outside the curated spec list in `tsconfig.spec.json` / `angular.json`, so nothing ever
 * ran it and nothing ever noticed.
 *
 * What that left untested is the whole point of the component: `normalizeStatus`, the
 * alias table that keeps 256 legacy `failed` rows and the runner's `skpped` typo from
 * rendering as "Unknown", and the `*ngSwitchDefault` that must render an unrecognised code
 * as a neutral grey "Unknown" rather than as anything benign.
 *
 * Translations are not loaded in these tests, so `TranslatePipe` echoes the key back and
 * the assertions match on `status.failure`, `status.unknown`, … directly.
 */
describe('StatusComponent (the shared status pill)', () => {
  let fixture: ComponentFixture<StatusComponent>;
  let component: StatusComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusComponent, TranslateModule.forRoot()],
      // The message disclosure links `previous job <id>` references out to the job screen.
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusComponent);
    component = fixture.componentInstance;
  });

  /** Render one raw `status_code` and hand back the pill element. */
  const render = (statusCode: unknown, statusMessage?: string | null, showMessage = false): HTMLElement => {
    component.statusCode = statusCode as string;
    component.statusMessage = statusMessage;
    component.showMessage = showMessage;
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('span[role="img"] > span') as HTMLElement;
  };

  const text = (el: HTMLElement | null): string => (el?.textContent ?? '').trim();

  // ---------------------------------------------------------------- canonical codes

  describe('the five canonical codes', () => {
    const CANONICAL: ReadonlyArray<[string, string, string]> = [
      [QueueStatusEnum.FAILURE, 'status.failure', 'text-danger'],
      [QueueStatusEnum.WARNING, 'status.warning', 'text-warning'],
      [QueueStatusEnum.SUCCESS, 'status.success', 'text-success'],
      [QueueStatusEnum.SKIPPED, 'status.skipped', 'text-muted'],
      [QueueStatusEnum.RUNNING, 'status.running', 'text-info']
    ];

    for (const [code, key, colour] of CANONICAL) {
      it(`renders "${code}" as its own pill`, () => {
        const pill = render(code);

        expect(text(pill)).toBe(key);
        expect(pill.className).withContext(`${code} pill colour`).toContain(colour);
        expect(component.code).toBe(code);
        expect(component.labelKey).toBe(key);
      });
    }

    it('covers every member of QueueStatusEnum', () => {
      // A sixth enum member added without a pill would otherwise fall to "Unknown" silently.
      expect(CANONICAL.map(([code]) => code).sort()).toEqual(Object.values(QueueStatusEnum).sort());
    });

    it('does not treat warning as a success', () => {
      const pill = render(QueueStatusEnum.WARNING);

      expect(text(pill)).not.toBe('status.success');
      expect(pill.className).not.toContain('text-success');
    });
  });

  // ---------------------------------------------------------------- the alias table

  describe('the legacy alias table', () => {
    it('maps every alias onto a canonical code', () => {
      for (const [legacy, canonical] of Object.entries(STATUS_ALIASES)) {
        expect(normalizeStatus(legacy)).withContext(`normalizeStatus('${legacy}')`).toBe(canonical);
        expect(text(render(legacy)))
          .withContext(`the pill for the legacy value '${legacy}'`)
          .toBe(`status.${canonical}`);
      }
    });

    /**
     * The two that are not hypothetical. On the ex63 database today the `jobs` table holds
     * 256 rows spelled `failed` beside 170 spelled `failure`; `skpped` is the runner's own
     * typo for a skipped joblist. Both must render as their canonical state, not "Unknown".
     */
    it("renders the runner's 'skpped' typo as Skipped", () => {
      expect(text(render('skpped'))).toBe('status.skipped');
    });

    it("renders the legacy 'failed' spelling as Failed", () => {
      const pill = render('failed');

      expect(text(pill)).toBe('status.failure');
      expect(pill.className).toContain('text-danger');
    });

    it('is case- and whitespace-insensitive, as Laravel rows are not always tidy', () => {
      expect(text(render('  FAILED '))).toBe('status.failure');
      expect(text(render('Success'))).toBe('status.success');
    });
  });

  // ---------------------------------------------------------------- unknown

  describe('a value the contract does not know', () => {
    // The API validates nothing on status_code (no `in:` rule), so this is reachable in
    // production, not a theoretical case.
    const STRANGE = ['cancelled', 'pending', 'aborted', 'wat', '42'];

    for (const value of STRANGE) {
      it(`renders "${value}" as the Unknown pill, never as success`, () => {
        const pill = render(value);

        expect(text(pill)).toBe('status.unknown');
        expect(pill.className).withContext('must not be styled as a success').not.toContain('text-success');
        expect(pill.className).not.toContain('bg-success-tint');
        expect(pill.className).toContain('text-muted');
      });
    }

    it('renders nothing-at-all as Unknown rather than blank or "null"', () => {
      expect(text(render(null))).toBe('status.unknown');
      expect(text(render(undefined))).toBe('status.unknown');
      expect(text(render(''))).toBe('status.unknown');
      expect(fixture.nativeElement.textContent).not.toContain('null');
    });

    it('leaves an unrecognised code alone rather than mapping it onto a canonical one', () => {
      expect(normalizeStatus('cancelled')).toBe('cancelled');
      expect(isCanonicalStatus('cancelled')).toBeFalse();
      expect(statusOrUnknown('cancelled')).toBe(UNKNOWN_STATUS);
    });
  });

  // ---------------------------------------------------------------- the message

  /**
   * The pill delegates the message to `app-status-message`, whose own spec covers the
   * split, the disclosure and the copy control. What is tested here is the contract
   * *between* the two: when the pill shows the message as text and what it therefore
   * announces.
   */
  describe('the runner diagnostic', () => {
    const MESSAGE =
      'DONE_JOBSWARNING - 8/204 jobs succeeded (0 warning, 49 failed, 147 skipped); lambda reported treatment_lost';

    const head = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="status-message-head"]');

    it('is not rendered as text unless showMessage is set', () => {
      render(QueueStatusEnum.WARNING, MESSAGE, false);

      expect(head()).toBeNull();
      expect(component.messageVisible).toBeFalse();
    });

    it('is rendered beside the pill when showMessage is set, first clause first', () => {
      render(QueueStatusEnum.WARNING, MESSAGE, true);

      expect(head()).not.toBeNull();
      expect(text(head())).toBe('DONE_JOBSWARNING');
      expect(component.messageVisible).toBeTrue();
    });

    it('offers the rest of the message in place, not only in a tooltip', () => {
      render(QueueStatusEnum.WARNING, MESSAGE, true);

      const toggle = fixture.nativeElement.querySelector('[data-testid="status-message-toggle"]') as HTMLElement;
      expect(toggle).withContext('a keyboard-operable disclosure, not a hover tooltip').not.toBeNull();

      toggle.click();
      fixture.detectChanges();

      const detail = fixture.nativeElement.querySelector('[data-testid="status-message-detail"]') as HTMLElement;
      expect(detail.textContent).toContain('8/204 jobs succeeded');
      expect(detail.textContent).toContain('treatment_lost');
    });

    it("tints the first clause with the pill's own severity", () => {
      render(QueueStatusEnum.FAILURE, MESSAGE, true);
      expect(head()!.className).toContain('text-danger');

      render(QueueStatusEnum.WARNING, MESSAGE, true);
      expect(head()!.className).toContain('text-warning');

      render(QueueStatusEnum.SUCCESS, MESSAGE, true);
      expect(head()!.className).toContain('text-muted');
    });

    it('keeps the full text in the pill title as a supplement for the mouse', () => {
      render(QueueStatusEnum.WARNING, MESSAGE, true);

      const labelled = fixture.nativeElement.querySelector('span[role="img"]') as HTMLElement;
      expect(labelled.getAttribute('title')).toBe(MESSAGE);
    });

    /**
     * The message used to be `aria-hidden` beside a pill whose `aria-label` repeated it.
     * That was defensible while it was inert text; it is not once the same text carries a
     * link and two buttons, because `aria-hidden` on focusable content hides controls a
     * keyboard user can still reach. So the pill announces the state, and the message is
     * announced as the real content it now is.
     */
    describe('what is announced', () => {
      it('announces the state alone when the message is on screen as text', () => {
        render(QueueStatusEnum.WARNING, MESSAGE, true);

        const labelled = fixture.nativeElement.querySelector('span[role="img"]') as HTMLElement;
        expect(labelled.getAttribute('aria-label')).toBe('status.warning');
        expect(component.ariaMessageSuffix).toBe('');
        expect(fixture.nativeElement.querySelector('[aria-hidden="true"]')).toBeNull();
      });

      it('still carries the message when it is NOT rendered — otherwise it is unreachable', () => {
        render(QueueStatusEnum.WARNING, MESSAGE, false);

        const labelled = fixture.nativeElement.querySelector('span[role="img"]') as HTMLElement;
        expect(labelled.getAttribute('aria-label')).toBe(`status.warning — ${MESSAGE}`);
      });

      it('announces the state alone when there is no diagnostic', () => {
        render(QueueStatusEnum.SUCCESS, null, true);

        const labelled = fixture.nativeElement.querySelector('span[role="img"]') as HTMLElement;
        expect(labelled.getAttribute('aria-label')).toBe('status.success');
        expect(labelled.getAttribute('title')).toBeNull();
        expect(component.message).toBe('');
      });
    });

    it('never renders the literal string "null" for a null message', () => {
      render(QueueStatusEnum.SUCCESS, null, true);

      expect(fixture.nativeElement.textContent).not.toContain('null');
    });
  });

  // ---------------------------------------------------------------- is_bad

  describe('isBadStatus (the contract\'s "a human should look at this")', () => {
    it('is failure OR warning — never failure alone', () => {
      expect(isBadStatus(QueueStatusEnum.FAILURE)).toBeTrue();
      expect(isBadStatus(QueueStatusEnum.WARNING)).toBeTrue();
      expect(isBadStatus('failed')).withContext('the legacy spelling counts too').toBeTrue();
      expect(isBadStatus('warn')).toBeTrue();
    });

    it('is false for success, skipped, running and unknown', () => {
      expect(isBadStatus(QueueStatusEnum.SUCCESS)).toBeFalse();
      expect(isBadStatus(QueueStatusEnum.SKIPPED)).toBeFalse();
      expect(isBadStatus(QueueStatusEnum.RUNNING)).toBeFalse();
      // Unknown is not an alarm — but it is not a success either; see the pill tests above.
      expect(isBadStatus('cancelled')).toBeFalse();
    });
  });
});
