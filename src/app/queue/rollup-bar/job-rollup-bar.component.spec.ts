import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { JobRollupBarComponent } from './job-rollup-bar.component';
import { Queue, queueJobRollupBreakdown } from '@app/queue/model/queue';

/**
 * The stacked bar that replaced the three `processed` / `processing` / `reviewed` Yes/No
 * columns on `/queues`.
 *
 * The case it exists for is queue 845 in the live database: `status_code` 'success',
 * message "done", and 22 of its 113 jobs failed. The old columns said "Processed: Yes" and
 * nothing else. What the bar must never do is round that into a green line — which is why
 * every assertion below is about the parts of the run that are *not* successes: the
 * failures, the skips, and above all the remainder nobody classified.
 */
describe('JobRollupBarComponent', () => {
  let fixture: ComponentFixture<JobRollupBarComponent>;
  let element: HTMLElement;

  /**
   * A deliberately unreadable translation: this spec is checking that the component hands
   * the right numbers to the right interpolation names, not that the English reads well.
   */
  const LABEL = 'S={{succeeded}} W={{warning}} F={{failed}} K={{skipped}} U={{unaccounted}} T={{total}}';

  const run = (over: Partial<Queue>): Queue => ({ id: 1, crawler_id: 1, ...over }) as Queue;

  const render = (value: Queue | null, footnote = ''): HTMLElement => {
    fixture.componentInstance.run = value;
    fixture.componentInstance.footnote = footnote;
    fixture.detectChanges();
    return element;
  };

  const segments = (): HTMLElement[] => Array.from(element.querySelectorAll<HTMLElement>('[data-segment]'));

  const widthOf = (kind: string): number => {
    const found = segments().find((segment) => segment.getAttribute('data-segment') === kind);
    return found ? parseFloat(found.style.width) : 0;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobRollupBarComponent, TranslateModule.forRoot()]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { queue: { rollup: { label: LABEL, none: 'no rollup' } } });
    translate.use('en');

    fixture = TestBed.createComponent(JobRollupBarComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  describe('when the API sent no rollup at all', () => {
    it('draws no bar and says so', () => {
      const el = render(run({ status_code: 'success' }));

      expect(el.querySelector('[data-rollup-bar]')).toBeNull();
      expect(el.textContent).toContain('no rollup');
    });

    it('does not invent a full green bar out of four absent counts', () => {
      // An API that predates the rollup sends nothing; zeros would read as "all fine".
      expect(render(run({})).querySelector('[data-segment="succeeded"]')).toBeNull();
    });

    it('is not fooled into "reported" by a decision count on its own', () => {
      // jobs_treatment_lost_count answers a different question and is not a status rollup.
      const el = render(run({ jobs_treatment_lost_count: 0 }));
      expect(el.querySelector('[data-rollup-bar]')).toBeNull();
    });
  });

  describe('arithmetic', () => {
    it('splits a fully accounted run into its four buckets', () => {
      render(
        run({
          jobs_count: 10,
          jobs_succeeded_count: 6,
          jobs_warning_count: 2,
          jobs_failed_count: 1,
          jobs_skipped_count: 1
        })
      );

      expect(widthOf('succeeded')).toBeCloseTo(60, 5);
      expect(widthOf('warning')).toBeCloseTo(20, 5);
      expect(widthOf('failed')).toBeCloseTo(10, 5);
      expect(widthOf('skipped')).toBeCloseTo(10, 5);
      expect(segments().length).toBe(4);
    });

    it('draws the unknown remainder rather than dropping it', () => {
      // Queue 845's shape: 8 of 113 jobs accounted for, and 105 that are running, not
      // started, or carry a status the API did not classify. Leaving them out would draw a
      // 100%-succeeded bar for a run that finished 7% of its work.
      const breakdown = queueJobRollupBreakdown(run({ jobs_count: 113, jobs_succeeded_count: 8 }));
      const remainder = breakdown.segments.find((segment) => segment.kind === 'unaccounted')!;

      expect(remainder.count).toBe(105);
      expect(remainder.percent).toBeCloseTo((105 / 113) * 100, 5);

      render(run({ jobs_count: 113, jobs_succeeded_count: 8 }));
      // Precision 3, not 5: the browser rounds an inline style width to four decimals, so
      // the DOM can only ever agree with the arithmetic to about that. The exact figure is
      // asserted on the breakdown above.
      expect(widthOf('unaccounted')).toBeCloseTo((105 / 113) * 100, 3);
      expect(widthOf('succeeded')).toBeCloseTo((8 / 113) * 100, 3);
    });

    it('never colours the remainder as success, warning, failure or skipped', () => {
      const el = render(run({ jobs_count: 100, jobs_succeeded_count: 1 }));
      const remainder = el.querySelector<HTMLElement>('[data-segment="unaccounted"]')!;

      expect(remainder.className).not.toContain('bg-success');
      expect(remainder.className).not.toContain('bg-warning');
      expect(remainder.className).not.toContain('bg-danger');
    });

    it('falls back to the sum of the parts when jobs_count is missing', () => {
      const breakdown = queueJobRollupBreakdown(
        run({ jobs_succeeded_count: 3, jobs_failed_count: 1, jobs_warning_count: 0, jobs_skipped_count: 0 })
      );

      expect(breakdown.total).toBe(4);
      expect(breakdown.segments.find((segment) => segment.kind === 'unaccounted')!.count).toBe(0);
    });

    it('clamps the remainder at zero when the parts exceed the total, and still fits 100%', () => {
      // An inconsistent rollup (counted mid-write) must not draw a negative slice, nor a
      // bar 130% wide that overflows its track.
      const suspect = run({ jobs_count: 5, jobs_succeeded_count: 4, jobs_failed_count: 4 });
      const breakdown = queueJobRollupBreakdown(suspect);

      expect(breakdown.segments.find((segment) => segment.kind === 'unaccounted')!.count).toBe(0);

      render(suspect);
      const total = segments().reduce((sum, segment) => sum + parseFloat(segment.style.width), 0);
      expect(total).toBeCloseTo(100, 3);
    });

    it('survives a run with no jobs at all without dividing by zero', () => {
      const breakdown = queueJobRollupBreakdown(run({ jobs_count: 0, jobs_succeeded_count: 0 }));

      expect(breakdown.total).toBe(0);
      expect(breakdown.segments.every((segment) => segment.percent === 0)).toBeTrue();
      expect(render(run({ jobs_count: 0, jobs_succeeded_count: 0 })).querySelectorAll('[data-segment]').length).toBe(0);
    });

    it('reads counts Laravel serialised as strings', () => {
      const breakdown = queueJobRollupBreakdown(
        run({ jobs_count: '10', jobs_succeeded_count: '7' } as unknown as Partial<Queue>)
      );

      expect(breakdown.total).toBe(10);
      expect(breakdown.segments.find((segment) => segment.kind === 'unaccounted')!.count).toBe(3);
    });
  });

  describe('the numbers', () => {
    it('carries every count, including the empty ones and the remainder, in the label', () => {
      const el = render(run({ jobs_count: 10, jobs_succeeded_count: 6, jobs_failed_count: 1 }));
      const bar = el.querySelector<HTMLElement>('[data-rollup-bar]')!;

      expect(bar.getAttribute('aria-label')).toBe('S=6 W=0 F=1 K=0 U=3 T=10');
    });

    it('says the same thing on hover as it does to a screen reader', () => {
      const bar = render(run({ jobs_count: 4, jobs_succeeded_count: 4 })).querySelector<HTMLElement>(
        '[data-rollup-bar]'
      )!;

      expect(bar.getAttribute('title')).toBe(bar.getAttribute('aria-label'));
      expect(bar.getAttribute('role')).toBe('img');
    });

    it('leaves an empty bucket out of the drawing but not out of the label', () => {
      const el = render(run({ jobs_count: 4, jobs_succeeded_count: 4 }));

      expect(el.querySelector('[data-segment="failed"]')).toBeNull();
      expect(el.querySelector<HTMLElement>('[data-rollup-bar]')!.getAttribute('aria-label')).toContain('F=0');
    });

    it('keeps one failure among two hundred jobs visible rather than sub-pixel', () => {
      const el = render(run({ jobs_count: 200, jobs_succeeded_count: 199, jobs_failed_count: 1 }));
      const failed = el.querySelector<HTMLElement>('[data-segment="failed"]')!;

      expect(failed).not.toBeNull();
      expect(failed.className).toContain('min-w-[2px]');
    });
  });

  describe('the footnote', () => {
    it('keeps the legacy processed/processing/reviewed flags reachable on hover and in the label', () => {
      const bar = render(
        run({ jobs_count: 2, jobs_succeeded_count: 2 }),
        'Completed: Yes · Running: No · Review: No'
      ).querySelector<HTMLElement>('[data-rollup-bar]')!;

      expect(bar.getAttribute('title')).toContain('Completed: Yes');
      expect(bar.getAttribute('aria-label')).toContain('Running: No');
      expect(bar.getAttribute('aria-label')).toContain('S=2');
    });

    it('is appended to the "no rollup" case too, so the flags never disappear entirely', () => {
      const el = render(run({}), 'Completed: Yes · Running: No · Review: No');
      expect(el.querySelector('span')!.getAttribute('title')).toContain('Completed: Yes');
    });

    it('adds no separator when there is no footnote', () => {
      const bar = render(run({ jobs_count: 1, jobs_succeeded_count: 1 })).querySelector<HTMLElement>(
        '[data-rollup-bar]'
      )!;
      expect(bar.getAttribute('title')!.endsWith('·')).toBeFalse();
      expect(bar.getAttribute('title')).toBe('S=1 W=0 F=0 K=0 U=0 T=1');
    });
  });
});
