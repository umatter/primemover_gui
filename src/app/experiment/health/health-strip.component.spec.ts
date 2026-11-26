import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { HealthStripComponent } from './health-strip.component';
import { ExperimentHealthApiService } from '@app/experiment/service/experiment-health-api.service';
import { Experiment } from '@app/experiment/model/experiment';
import { ExperimentHealth, HealthCounts } from '@app/experiment/model/health';

/**
 * The strip is the only thing on the experiments grid that says whether a study needs
 * attention. Its four states are asserted through the real template, because the failure
 * that matters is not a wrong number — it is a **green** strip on a study that is not
 * fine, and green is a class name, not a return value.
 */
describe('HealthStripComponent', () => {
  let fixture: ComponentFixture<HealthStripComponent>;
  let health: jasmine.Spy;

  const counts = (over: Partial<HealthCounts> = {}): HealthCounts => ({
    total: 0,
    running: 0,
    success: 0,
    warning: 0,
    failure: 0,
    skipped: 0,
    unknown: 0,
    ...over
  });

  const payload = (over: Partial<ExperimentHealth> = {}): ExperimentHealth => ({
    experiment_id: 42,
    window_hours: 24,
    bots: 3,
    runs: counts(),
    jobs: counts(),
    bad_runs: 0,
    bad_jobs: 0,
    treatment_lost_jobs: 0,
    degraded_jobs: 0,
    bots_not_starting: [],
    last_finished_at: null,
    ...over
  });

  const experiment = (over: Partial<Experiment> = {}): Experiment =>
    ({ id: 42, name: 'Political News', updated_at: '2026-09-01T10:00:00Z', ...over }) as Experiment;

  /** Renders the strip for one experiment against a given health answer. */
  const render = (exp: Experiment, answer: Observable<ExperimentHealth | null> = of(null)): HTMLElement => {
    health.and.returnValue(answer);
    fixture.componentInstance.experiment = exp;
    fixture.componentInstance.ngOnChanges({ experiment: {} as never });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const state = (el: HTMLElement): string | null =>
    el.querySelector('[data-health-state]')?.getAttribute('data-health-state') ?? null;

  beforeEach(async () => {
    health = jasmine.createSpy('health').and.returnValue(of(null));
    await TestBed.configureTestingModule({
      imports: [HealthStripComponent, TranslateModule.forRoot()],
      providers: [{ provide: ExperimentHealthApiService, useValue: { health } }]
    }).compileComponents();
    fixture = TestBed.createComponent(HealthStripComponent);
  });

  describe('the four states', () => {
    it('is red when the bad runs are driven by failure', () => {
      const el = render(
        experiment({ runs_bad_count: 2 }),
        of(payload({ runs: counts({ total: 6, success: 4, failure: 2 }), bad_runs: 2 }))
      );

      expect(state(el)).toBe('failure');
      expect(el.innerHTML).toContain('bg-danger');
      expect(el.textContent).toContain('health.strip.attention');
    });

    it('is amber when they are driven by warning', () => {
      const el = render(
        experiment({ runs_bad_count: 1 }),
        of(payload({ runs: counts({ total: 6, success: 5, warning: 1 }), bad_runs: 1 }))
      );

      expect(state(el)).toBe('warning');
      expect(el.innerHTML).toContain('bg-warning');
      expect(el.innerHTML).not.toContain('bg-danger');
    });

    it('is green when every run in the window completed cleanly', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(payload({ runs: counts({ total: 6, success: 6 }) })));

      expect(state(el)).toBe('clean');
      expect(el.textContent).toContain('health.strip.clean');
      expect(el.innerHTML).toContain('bg-success');
    });

    it('is neutral grey against an API that appends neither the count nor the endpoint', () => {
      // This is the path production takes today: no runs_bad_count on the row, 404 on
      // /health. Green here would be a claim nothing in the system ever made.
      const el = render(experiment(), of(null));

      expect(state(el)).toBe('unknown');
      expect(el.textContent).toContain('health.strip.noData');
      expect(el.innerHTML).not.toContain('bg-success');
      expect(el.innerHTML).not.toContain('bg-warning');
      expect(el.innerHTML).not.toContain('bg-danger');
      expect(el.textContent).not.toContain('undefined');
      expect(el.textContent).not.toContain('NaN');
    });
  });

  describe('a health call that cannot be answered', () => {
    it('renders unknown rather than throwing when the endpoint 404s', () => {
      // The service resolves a 404 to null; the strip must not need to know that, and
      // must not be the thing that turns it into an error.
      expect(() => render(experiment(), of(null))).not.toThrow();
      expect(state(fixture.nativeElement)).toBe('unknown');
    });

    it('still reports attention from runs_bad_count alone when /health is unavailable', () => {
      const el = render(experiment({ runs_bad_count: 3 }), of(null));

      expect(state(el)).toBe('warning');
      // No total is known, so it does not claim one.
      expect(fixture.componentInstance.headlineKey).toBe('health.strip.attentionNoTotal');
      expect(el.textContent).toContain('health.strip.attentionNoTotal');
    });

    it('survives a service that errors instead of degrading, without going green', () => {
      // Defence in depth: if the service contract is ever broken, the strip must fail
      // neutral, never clean.
      const el = render(
        experiment(),
        throwError(() => new Error('boom'))
      );

      expect(state(el)).toBe('unknown');
    });
  });

  describe('what it says', () => {
    it('shows "N of M runs need attention" once the totals are known', () => {
      const el = render(
        experiment({ runs_bad_count: 2 }),
        of(payload({ runs: counts({ total: 9, success: 7, warning: 2 }), bad_runs: 2 }))
      );
      const headline = el.querySelector('p')!;

      expect(headline.textContent).toContain('health.strip.attention');
      expect(fixture.componentInstance.headlineParams).toEqual({
        bad: 2,
        total: 9,
        unknown: 0,
        success: 7,
        running: 0,
        skipped: 0,
        badJobs: 0,
        totalJobs: 0,
        unknownJobs: 0,
        unaccounted: 0
      });
    });

    it('shows the last run instead of the experiment mtime when the window has one', () => {
      const el = render(
        experiment(),
        of(payload({ runs: counts({ total: 2, success: 2 }), last_finished_at: '2026-09-07T06:30:00Z' }))
      );

      expect(el.textContent).toContain('health.strip.lastRun');
      expect(el.textContent).not.toContain('projects.updated');
    });

    it('falls back to the experiment mtime when nothing has finished', () => {
      const el = render(experiment(), of(null));

      expect(el.textContent).toContain('projects.updated');
    });

    it('says "no runs in this window" rather than calling an empty window clean', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(payload({ runs: counts({ total: 0 }) })));

      expect(state(el)).toBe('unknown');
      expect(el.textContent).toContain('health.strip.noRuns');
    });

    it('names runs with an unrecognised status and keeps them out of the green', () => {
      const el = render(experiment(), of(payload({ runs: counts({ total: 4, success: 3, unknown: 1 }) })));

      expect(state(el)).toBe('unknown');
      expect(el.textContent).toContain('health.strip.unknownRuns');
    });

    it('raises the treatment alarm in red over an otherwise clean strip', () => {
      // Those runs finished green: the run statuses are fine and the science is not.
      const el = render(
        experiment({ runs_bad_count: 0 }),
        of(payload({ runs: counts({ total: 4, success: 4 }), treatment_lost_jobs: 2 }))
      );

      expect(state(el)).withContext('the run statuses really are clean').toBe('clean');
      expect(el.textContent).toContain('decision.alarm.jobs');
      expect(el.innerHTML).withContext('but the strip is red, not green').toContain('bg-danger-tint');
    });
  });

  /**
   * The strip renders from two independent tallies, and only one of them used to reach
   * it. A study whose runs all report `success` while its jobs failed was the exact shape
   * that painted green on the triage screen while the bot detail one click deeper painted
   * the same run red.
   */
  describe('when the runs are fine and the jobs are not', () => {
    /** Queue 845, live in production: run 'success', 22 of its 113 jobs failed. */
    const jobsBad = payload({
      runs: counts({ total: 1, success: 1 }),
      bad_runs: 0,
      jobs: counts({ total: 113, success: 91, failure: 22 }),
      bad_jobs: 22
    });

    it('is red rather than "All 1 runs completed cleanly"', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(jobsBad));

      expect(state(el)).toBe('failure');
      expect(el.textContent).not.toContain('health.strip.clean');
      expect(el.innerHTML).toContain('bg-danger');
    });

    it('says what is wrong instead of "0 of 1 runs need attention"', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(jobsBad));

      expect(fixture.componentInstance.headlineKey).toBe('health.strip.jobsAttention');
      expect(fixture.componentInstance.headlineParams['badJobs']).toBe(22);
      expect(fixture.componentInstance.headlineParams['totalJobs']).toBe(113);
      expect(el.textContent).toContain('health.strip.jobsAttention');
    });

    it('turns amber, not red, when the jobs only degraded', () => {
      const el = render(
        experiment({ runs_bad_count: 0 }),
        of(
          payload({
            runs: counts({ total: 3, success: 3 }),
            jobs: counts({ total: 60, success: 56, warning: 4 }),
            bad_jobs: 4
          })
        )
      );

      expect(state(el)).toBe('warning');
      expect(el.innerHTML).toContain('bg-warning');
      expect(el.innerHTML).not.toContain('bg-danger');
    });

    it('adds the job figure under a run-driven headline instead of dropping it', () => {
      const el = render(
        experiment({ runs_bad_count: 1 }),
        of(
          payload({
            runs: counts({ total: 6, success: 5, failure: 1 }),
            bad_runs: 1,
            jobs: counts({ total: 100, success: 80, failure: 20 }),
            bad_jobs: 20
          })
        )
      );

      expect(fixture.componentInstance.headlineKey).toBe('health.strip.attention');
      expect(el.textContent)
        .withContext('the headline is about the runs; the jobs get their own line')
        .toContain('health.strip.jobsAttention');
    });

    it('states the job figure once when it is already the headline', () => {
      render(experiment({ runs_bad_count: 0 }), of(jobsBad));

      expect(fixture.componentInstance.showJobsAttention).toBeFalse();
    });

    it('leaves a study whose jobs are as clean as its runs green', () => {
      const el = render(
        experiment({ runs_bad_count: 0 }),
        of(payload({ runs: counts({ total: 6, success: 6 }), jobs: counts({ total: 90, success: 90 }) }))
      );

      expect(state(el)).toBe('clean');
      expect(el.textContent).toContain('health.strip.clean');
    });
  });

  describe('when the window is still running', () => {
    it('does not claim that runs still in flight completed cleanly', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(payload({ runs: counts({ total: 12, running: 12 }) })));

      expect(state(el)).toBe('running');
      expect(el.textContent).toContain('health.strip.running');
      expect(el.textContent).not.toContain('health.strip.clean');
      expect(el.innerHTML).withContext('in progress is not a clean bill of health').not.toContain('bg-success');
    });

    it('names the skipped runs rather than saying all of them completed', () => {
      const el = render(
        experiment({ runs_bad_count: 0 }),
        of(payload({ runs: counts({ total: 4, success: 3, skipped: 1 }) }))
      );

      expect(state(el)).toBe('clean');
      expect(el.textContent).toContain('health.strip.cleanWithSkipped');
      expect(el.textContent).not.toContain('health.strip.cleanNoTotal');
      expect(fixture.componentInstance.headlineParams['skipped']).toBe(1);
      expect(fixture.componentInstance.headlineParams['success']).toBe(3);
    });

    it('reports runs the buckets cannot account for as unaccounted, not as clean', () => {
      const el = render(experiment({ runs_bad_count: 0 }), of(payload({ runs: counts({ total: 5, success: 3 }) })));

      expect(state(el)).toBe('unknown');
      expect(el.textContent).toContain('health.strip.unaccountedRuns');
      expect(fixture.componentInstance.headlineParams['unaccounted']).toBe(2);
    });

    it('names jobs with an unrecognised status when nothing worse is present', () => {
      const el = render(
        experiment({ runs_bad_count: 0 }),
        of(payload({ runs: counts({ total: 2, success: 2 }), jobs: counts({ total: 20, success: 19, unknown: 1 }) }))
      );

      expect(state(el)).toBe('unknown');
      expect(el.textContent).toContain('health.strip.unknownJobs');
    });
  });

  describe('how it asks', () => {
    it('asks for this experiment over the default window', () => {
      render(experiment({ id: 251 }));

      expect(health).toHaveBeenCalledWith(251, 24);
    });

    it('re-asks when the window changes', () => {
      render(experiment({ id: 251 }));
      fixture.componentInstance.hours = 168;
      fixture.componentInstance.ngOnChanges({ hours: {} as never });

      expect(health).toHaveBeenCalledWith(251, 168);
    });

    it('does not ask for an experiment that is not there', () => {
      fixture.componentInstance.experiment = null;
      fixture.componentInstance.ngOnChanges({ experiment: {} as never });
      fixture.detectChanges();

      expect(health).not.toHaveBeenCalled();
    });
  });
});
