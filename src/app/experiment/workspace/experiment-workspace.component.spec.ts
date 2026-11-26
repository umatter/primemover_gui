import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ExperimentWorkspaceComponent } from './experiment-workspace.component';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { Crawler } from '@app/crawler/model/crawler';
import { ExperimentHealthApiService } from '@app/experiment/service/experiment-health-api.service';
import { ExperimentHealth, HealthCounts } from '@app/experiment/model/health';

/**
 * The workspace's "Needs attention" tile, per-bot badge and amber progress bar read TWO
 * API attributes, appended by the Laravel Crawler model alongside
 * `latest_queues_succeeded` / `_failed` / `_count`:
 *
 *  - `latest_queues_degraded` — runs carrying at least one `warning` JOB (live since
 *    2026-08-27, verified against the live API on that date);
 *  - `latest_queues_warning`  — runs whose OWN status_code is `warning` (new; NOT sent by
 *    the API deployed on ex63 today, so the undefined path is the one that actually runs
 *    in production and is tested first).
 *
 * The whole feature is dead pixels if either name drifts, which is what these tests pin
 * down.
 */
describe('ExperimentWorkspaceComponent (runs that need attention)', () => {
  let component: ExperimentWorkspaceComponent;
  let fixture: ComponentFixture<ExperimentWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: {} }),
        {
          provide: ExperimentService,
          useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) }
        },
        {
          provide: CrawlerService,
          useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {} }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
        // The API deployed today has no /health endpoint, so the service answers null and
        // the header falls back to these crawler-derived tiles. That is the path every
        // assertion in this file exercises; the health path has its own describe below.
        { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentWorkspaceComponent);
    component = fixture.componentInstance;
  });

  /**
   * Recorded verbatim from the live API on 2026-08-27:
   *   GET /api/v1/crawlers?filter[experiment]=42  ->  200
   * Four of experiment 42's fourteen bots, with the four `latest_queues_*` attributes
   * exactly as the Laravel Crawler model appends them. This is the shape the tile has to
   * read; if `latest_queues_degraded` is ever renamed API-side, the DOM tests below go
   * red instead of the tile quietly going blank.
   */
  const LIVE_CRAWLERS_EXP42 = [
    { id: 251, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 250, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 249, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 248, latest_queues_succeeded: 0, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 }
  ];

  const bot = (over: Partial<Crawler>): Crawler =>
    ({
      id: 1,
      name: 'bot',
      experiment_id: 42,
      latest_queues_count: 0,
      latest_queues_succeeded: 0,
      latest_queues_failed: 0,
      ...over
    }) as Crawler;

  describe('against an API that reports degradation', () => {
    it('reads the count off latest_queues_degraded', () => {
      expect(component.botDegraded(bot({ latest_queues_count: 4, latest_queues_degraded: 3 }))).toBe(3);
    });

    it('sums the tile across bots and marks it available', () => {
      const summary = component.buildSummary([
        bot({ id: 1, latest_queues_count: 4, latest_queues_succeeded: 4, latest_queues_degraded: 3 }),
        bot({
          id: 2,
          latest_queues_count: 2,
          latest_queues_succeeded: 1,
          latest_queues_failed: 1,
          latest_queues_degraded: 0
        })
      ]);

      expect(summary.attentionAvailable).toBeTrue();
      expect(summary.degraded).toBe(3);
      expect(summary.needsAttention).toBe(3);
      expect(summary.total).toBe(6);
      expect(summary.succeeded).toBe(5);
      expect(summary.failed).toBe(1);
    });

    // Laravel has been known to serialise appended integer attributes as strings.
    it('tolerates the count arriving as a string', () => {
      expect(component.botDegraded(bot({ latest_queues_degraded: '2' as unknown as number }))).toBe(2);
      expect(component.botWarning(bot({ latest_queues_warning: '2' as unknown as number }))).toBe(2);
    });

    it('shows the tile at a confident zero', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 3, latest_queues_degraded: 0 })]);

      expect(summary.attentionAvailable).toBeTrue();
      expect(summary.needsAttention).toBe(0);
    });

    it('puts a degraded bot between succeeded and failed', () => {
      expect(
        component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 1 }))
      ).toBe('warning');
      // A failed run still outranks a degraded one.
      expect(
        component.botState(
          bot({
            latest_queues_count: 3,
            latest_queues_succeeded: 2,
            latest_queues_failed: 1,
            latest_queues_degraded: 1
          })
        )
      ).toBe('failed');
      expect(
        component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 0 }))
      ).toBe('succeeded');
    });
  });

  describe('against an API that predates the attribute', () => {
    it('hides the tile rather than claiming a zero the API never sent', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 3, latest_queues_succeeded: 3 })]);

      expect(summary.attentionAvailable).toBeFalse();
      expect(summary.needsAttention).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.degraded).toBe(0);
    });

    it('does not turn a healthy bot amber', () => {
      expect(component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3 }))).toBe('succeeded');
    });
  });

  /**
   * The tile is the thing that was dead: it read an attribute the API did not send, so it
   * rendered `undefined` (or, once guarded, hid itself forever). These drive the real
   * template over the real payload shape.
   */
  describe('the "Needs attention" tile, rendered', () => {
    /** Boots the component with a crawler list, as the API would deliver it. */
    const renderWith = (crawlers: unknown[]): ComponentFixture<ExperimentWorkspaceComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          // The API deployed today has no /health endpoint, so the service answers null and
          // the header falls back to these crawler-derived tiles. That is the path every
          // assertion in this file exercises; the health path has its own describe below.
          { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    /** The stat tile whose label is `key`. Translations are unloaded here, so the
     *  TranslatePipe echoes the key back and it can be matched on directly. */
    const tile = (f: ComponentFixture<unknown>, key: string): HTMLElement | undefined =>
      Array.from(f.nativeElement.querySelectorAll('section div.bg-surface') as NodeListOf<HTMLElement>).find((el) =>
        el.textContent?.includes(key)
      );

    const tileValue = (f: ComponentFixture<unknown>, key: string): string | undefined =>
      tile(f, key)?.querySelector('p:nth-of-type(2)')?.textContent?.trim();

    it('renders a real number -- not "undefined" -- from the live payload', () => {
      const f = renderWith(LIVE_CRAWLERS_EXP42.map((c) => ({ ...c, experiment_id: 42, name: 'bot' })));

      expect(tile(f, 'workspace.stat.needsAttention')).withContext('Needs attention tile is present').toBeDefined();
      expect(tileValue(f, 'workspace.stat.needsAttention')).toBe('0');
      expect(f.nativeElement.textContent).not.toContain('undefined');
      expect(f.nativeElement.textContent).not.toContain('NaN');
      // sanity: the neighbouring tiles agree with the same payload
      expect(tileValue(f, 'workspace.stat.runs')).toBe('4');
      expect(tileValue(f, 'workspace.stat.succeeded')).toBe('3');
      expect(tileValue(f, 'workspace.stat.failed')).toBe('0');
    });

    it('counts degraded runs when the API reports some', () => {
      const f = renderWith([
        // Two runs, both degraded: `latest_queues_degraded` counts runs in the same window
        // as `latest_queues_count`, so it can never exceed it — and the tile clamps to the
        // run count rather than printing a figure larger than the runs beside it.
        {
          ...LIVE_CRAWLERS_EXP42[0],
          experiment_id: 42,
          name: 'treated bot',
          latest_queues_count: 2,
          latest_queues_succeeded: 0,
          latest_queues_degraded: 2
        },
        { ...LIVE_CRAWLERS_EXP42[1], experiment_id: 42, name: 'control bot' }
      ]);

      expect(tileValue(f, 'workspace.stat.needsAttention')).toBe('2');
      // The bot badge escalates too, and the progress bar goes amber rather than green.
      expect(f.nativeElement.textContent).toContain('workspace.state.warning');
      expect(f.nativeElement.querySelector('.bg-warning')).not.toBeNull();
    });

    it('hides the tile entirely against an API that does not send the attribute', () => {
      const f = renderWith(
        LIVE_CRAWLERS_EXP42.map(({ latest_queues_degraded, ...rest }) => ({
          ...rest,
          experiment_id: 42,
          name: 'bot'
        }))
      );

      expect(tile(f, 'workspace.stat.needsAttention')).toBeUndefined();
      expect(f.nativeElement.textContent).not.toContain('undefined');
      // the rest of the summary is unaffected
      expect(tileValue(f, 'workspace.stat.runs')).toBe('4');
    });
  });

  /**
   * F1 in docs/proposals/gui-error-warning-surfacing.md, and the reason
   * `latest_queues_warning` exists at all.
   *
   * A run whose OWN status_code is `warning` — the runner's `DONE_JOBSWARNING`, "completed
   * but lost work" — is counted by none of `latest_queues_succeeded`, `_failed` or
   * `_degraded` (that last one is derived from the JOBS, and a queue can report `warning`
   * with zero `warning` jobs). So `succeeded >= total` was never satisfied, `botState`
   * fell through to `running`, and the bot card showed a pulsing blue "Running" pill
   * forever for a run that had finished hours before in the one state a researcher most
   * needs to see.
   */
  describe('a run whose OWN status was warning (latest_queues_warning)', () => {
    it('no longer shows a finished bot as "Running" forever', () => {
      const stuck = bot({ latest_queues_count: 3, latest_queues_succeeded: 2, latest_queues_warning: 1 });

      expect(component.botState(stuck)).toBe('warning');
    });

    it('leaves the run the buckets cannot explain as unknown, not as a benign state', () => {
      // 3 runs, 2 succeeded, 0 warning, 0 failed: the third is still going, or skipped, or
      // carrying a code nobody recognises, and the crawler rollups cannot tell the three
      // apart. It used to read 'running' — a claim about work in flight that the payload
      // does not support.
      expect(
        component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 2, latest_queues_warning: 0 }))
      ).toBe('unknown');
    });

    it('still ranks a failure above a queue-level warning', () => {
      expect(
        component.botState(
          bot({ latest_queues_count: 3, latest_queues_succeeded: 1, latest_queues_failed: 1, latest_queues_warning: 1 })
        )
      ).toBe('failed');
    });

    it('counts it in the tile alongside job-level degradation', () => {
      const summary = component.buildSummary([
        bot({ id: 1, latest_queues_count: 2, latest_queues_succeeded: 1, latest_queues_warning: 1 }),
        bot({ id: 2, latest_queues_count: 2, latest_queues_succeeded: 2, latest_queues_degraded: 2 })
      ]);

      expect(summary.warning).toBe(1);
      expect(summary.degraded).toBe(2);
      expect(summary.needsAttention).toBe(3);
      expect(summary.attentionAvailable).toBeTrue();
    });

    it('makes the tile available even when only latest_queues_warning is sent', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 1, latest_queues_warning: 0 })]);

      expect(summary.attentionAvailable).toBeTrue();
      expect(summary.needsAttention).toBe(0);
    });
  });

  /**
   * The API deployed on ex63 today sends `latest_queues_degraded` and NOT
   * `latest_queues_warning`. That is the path every production page load takes, so it is
   * tested explicitly rather than assumed: undefined reads as 0 and nothing regresses.
   */
  describe('against the API actually deployed today (no latest_queues_warning)', () => {
    it('treats the missing field as 0 rather than NaN or a false alarm', () => {
      const deployed = bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 0 });

      expect(component.botWarning(deployed)).toBe(0);
      expect(component.botNeedsAttention(deployed)).toBe(0);
      expect(component.botState(deployed)).toBe('succeeded');
    });

    it('keeps the pre-existing job-level degradation behaviour exactly', () => {
      const degraded = bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 1 });

      expect(component.botState(degraded)).toBe('warning');
      expect(component.botNeedsAttention(degraded)).toBe(1);
    });

    it('reports an unaccounted remainder as unknown rather than as running', () => {
      // 4 runs, 1 succeeded. Three of them may be in flight — or may have been skipped
      // hours ago. The API sends no running/skipped count, so the pill says so.
      expect(
        component.botState(bot({ latest_queues_count: 4, latest_queues_succeeded: 1, latest_queues_degraded: 0 }))
      ).toBe('unknown');
    });
  });

  describe('a bot with no runs in the window', () => {
    it('is idle and does not divide by zero', () => {
      const idle = bot({});

      expect(component.botState(idle)).toBe('idle');
      expect(component.botProgress(idle)).toBe(0);
    });

    it('leaves the summary percentages at zero rather than NaN', () => {
      const summary = component.buildSummary([bot({})]);

      expect(summary.total).toBe(0);
      expect(summary.succeededPct).toBe(0);
      expect(summary.failedPct).toBe(0);
    });

    it('survives an experiment with no bots at all', () => {
      const summary = component.buildSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.succeededPct).toBe(0);
      expect(summary.attentionAvailable).toBeFalse();
    });
  });
  /**
   * Phase 4 — the treatment-loss alarm (`latest_queues_treatment_lost`, contract §7.3).
   *
   * It is deliberately NOT part of `needsAttention`: a lost treatment is not a louder
   * warning but a different claim — those runs finished, often green, and produced
   * control-arm data while configured to be treated. Folding it into the amber sum is
   * how it would stop being an alarm.
   */
  describe('the treatment-loss alarm', () => {
    const renderWith = (crawlers: unknown[]): ComponentFixture<ExperimentWorkspaceComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          // The API deployed today has no /health endpoint, so the service answers null and
          // the header falls back to these crawler-derived tiles. That is the path every
          // assertion in this file exercises; the health path has its own describe below.
          { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    it('sums latest_queues_treatment_lost and keeps it out of needsAttention', () => {
      const summary = component.buildSummary([
        bot({ id: 1, latest_queues_count: 4, latest_queues_succeeded: 4, latest_queues_treatment_lost: 2 }),
        bot({ id: 2, latest_queues_count: 2, latest_queues_succeeded: 2, latest_queues_treatment_lost: 1 })
      ]);

      expect(summary.treatmentLost).toBe(3);
      expect(summary.treatmentLostAvailable).toBeTrue();
      expect(summary.needsAttention).withContext('the alarm is not folded into the amber sum').toBe(0);
    });

    it('reads an absent field as unknown rather than as a confident zero', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 3, latest_queues_succeeded: 3 })]);

      expect(summary.treatmentLostAvailable).toBeFalse();
      expect(summary.treatmentLost).toBe(0);
    });

    it('tolerates the count arriving as a string', () => {
      expect(component.botTreatmentLost(bot({ latest_queues_treatment_lost: '2' as unknown as number }))).toBe(2);
    });

    it('renders a red alert above the tiles when a treatment was lost', () => {
      const f = renderWith([
        {
          id: 251,
          experiment_id: 42,
          name: 'treated bot',
          latest_queues_count: 2,
          latest_queues_succeeded: 2,
          latest_queues_treatment_lost: 1
        }
      ]);
      const alert = f.nativeElement.querySelector('[role="alert"]') as HTMLElement;

      expect(alert).withContext('the alarm is rendered').not.toBeNull();
      expect(alert.textContent).toContain('decision.alarm.experiment');
      expect(alert.className).toContain('text-danger');
      // ...and it sits above the run-summary tiles.
      const html: string = f.nativeElement.innerHTML;
      expect(html.indexOf('decision.alarm.experiment')).toBeLessThan(html.indexOf('workspace.stat.runs'));
    });

    it('shows no alarm at zero — a nullable column cannot assert "no treatment was lost"', () => {
      const f = renderWith([
        {
          id: 251,
          experiment_id: 42,
          name: 'bot',
          latest_queues_count: 2,
          latest_queues_succeeded: 2,
          latest_queues_treatment_lost: 0
        }
      ]);

      expect(f.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(f.nativeElement.textContent).not.toContain('decision.alarm.experiment');
    });

    it('marks the bot card red for a lost treatment even when every run succeeded', () => {
      const f = renderWith([
        {
          id: 251,
          experiment_id: 42,
          name: 'treated bot',
          latest_queues_count: 2,
          latest_queues_succeeded: 2,
          latest_queues_treatment_lost: 1
        }
      ]);
      const card = f.nativeElement.querySelector('article') as HTMLElement;

      expect(card.textContent).toContain('decision.alarm.botRuns');
      expect(card.innerHTML).withContext('the progress bar goes red, not green').toContain('bg-danger');
    });
  });
  /**
   * Phase 3 — health above the bot.
   *
   * The header's figures move from the crawler rollups (a fixed 24 h window, no unknown
   * bucket, no job-level view) to `GET /experiments/{id}/health?hours=…`, which is the
   * only place runs are counted by their OWN status_code over a chosen window. Two things
   * are load-bearing and are what these tests hold down: the **unknown** bucket is
   * rendered and never folded into success, and an API that cannot answer falls back to
   * the old tiles rather than to a blank — or worse, a green — header.
   */
  describe('the health header', () => {
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
      bots: 14,
      runs: counts({ total: 10, success: 7, warning: 2, failure: 1 }),
      jobs: counts({ total: 200, success: 180, warning: 15, failure: 5 }),
      bad_runs: 3,
      bad_jobs: 20,
      treatment_lost_jobs: 0,
      degraded_jobs: 15,
      bots_not_starting: [],
      last_finished_at: '2026-09-07T06:00:00Z',
      ...over
    });

    let healthSpy: jasmine.Spy;

    const renderWithHealth = (
      health: ExperimentHealth | null,
      crawlers: unknown[] = []
    ): ComponentFixture<ExperimentWorkspaceComponent> => {
      healthSpy = jasmine.createSpy('health').and.returnValue(of(health));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          { provide: ExperimentHealthApiService, useValue: { health: healthSpy } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    const tile = (f: ComponentFixture<unknown>, key: string): HTMLElement | undefined =>
      Array.from(f.nativeElement.querySelectorAll('section div.bg-surface') as NodeListOf<HTMLElement>).find((el) =>
        el.textContent?.includes(key)
      );

    const tileValue = (f: ComponentFixture<unknown>, key: string): string | undefined =>
      tile(f, key)?.querySelector('p:nth-of-type(2)')?.textContent?.trim();

    it('renders the health figures as tiles', () => {
      const f = renderWithHealth(payload());

      expect(tileValue(f, 'workspace.stat.bots')).toBe('14');
      expect(tileValue(f, 'workspace.stat.runs')).toBe('10');
      expect(tileValue(f, 'workspace.stat.succeeded')).toBe('7');
      // bad_runs is the contract's is_bad: failure OR warning, never failure alone.
      expect(tileValue(f, 'workspace.stat.needsAttention')).toBe('3');
      expect(tileValue(f, 'workspace.stat.failed')).toBe('1');
      expect(f.nativeElement.textContent).not.toContain('undefined');
      expect(f.nativeElement.textContent).not.toContain('NaN');
    });

    it('shows the unknown bucket when it is non-zero, separately from success', () => {
      const f = renderWithHealth(
        payload({ runs: counts({ total: 10, success: 6, warning: 2, failure: 1, unknown: 1 }), bad_runs: 3 })
      );

      expect(tile(f, 'status.unknown')).withContext('an unknown-status run has its own tile').toBeDefined();
      expect(tileValue(f, 'status.unknown')).toBe('1');
      expect(tileValue(f, 'workspace.stat.succeeded')).withContext('never folded into success').toBe('6');
    });

    it('hides the unknown tile when nothing is unknown', () => {
      const f = renderWithHealth(payload());

      expect(tile(f, 'status.unknown')).toBeUndefined();
    });

    it('names jobs with an unrecognised status instead of absorbing them into success', () => {
      const f = renderWithHealth(
        payload({ jobs: counts({ total: 200, success: 180, warning: 15, failure: 4, unknown: 1 }) })
      );

      expect(f.nativeElement.textContent).toContain('health.jobs.unknown');
    });

    it('reports the jobs and the treatment-loss alarm from the same window', () => {
      const f = renderWithHealth(payload({ treatment_lost_jobs: 4 }));

      expect(f.nativeElement.textContent).toContain('health.jobs.summary');
      expect(f.nativeElement.textContent).toContain('decision.alarm.jobs');
    });

    it('falls back to the crawler tiles when the endpoint cannot answer', () => {
      // A 404 from an API that predates the endpoint arrives as null. The header must
      // keep working — and must not turn into a green "all clear" it never computed.
      const f = renderWithHealth(null, [
        { id: 251, experiment_id: 42, name: 'bot', latest_queues_count: 4, latest_queues_succeeded: 3 }
      ]);

      expect(tileValue(f, 'workspace.stat.runs')).withContext('crawler-derived tiles').toBe('4');
      expect(f.nativeElement.querySelector('[data-window]'))
        .withContext('no window selector: there is nothing behind it to select')
        .toBeNull();
      expect(f.nativeElement.textContent).not.toContain('undefined');
    });
  });

  describe('the health window selector', () => {
    let component2: ExperimentWorkspaceComponent;
    let healthSpy: jasmine.Spy;
    let fixture2: ComponentFixture<ExperimentWorkspaceComponent>;

    const health: ExperimentHealth = {
      experiment_id: 42,
      window_hours: 24,
      bots: 1,
      runs: { total: 1, running: 0, success: 1, warning: 0, failure: 0, skipped: 0, unknown: 0 },
      jobs: { total: 1, running: 0, success: 1, warning: 0, failure: 0, skipped: 0, unknown: 0 },
      bad_runs: 0,
      bad_jobs: 0,
      treatment_lost_jobs: 0,
      degraded_jobs: 0,
      bots_not_starting: [],
      last_finished_at: null
    };

    beforeEach(() => {
      healthSpy = jasmine.createSpy('health').and.returnValue(of(health));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          { provide: CrawlerService, useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {} } },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          { provide: ExperimentHealthApiService, useValue: { health: healthSpy } }
        ]
      });
      fixture2 = TestBed.createComponent(ExperimentWorkspaceComponent);
      component2 = fixture2.componentInstance;
      fixture2.detectChanges();
    });

    it('opens on 24 h and asks for hours=24', () => {
      expect(component2.healthWindow).toBe('24h');
      expect(healthSpy).toHaveBeenCalledWith(42, 24);
    });

    it('maps 7d to hours=168 and all to hours=720', () => {
      component2.setWindow('7d');
      expect(component2.windowHours).toBe(168);
      expect(healthSpy).toHaveBeenCalledWith(42, 168);

      component2.setWindow('all');
      expect(component2.windowHours).toBe(720);
      expect(healthSpy).toHaveBeenCalledWith(42, 720);
    });

    it('does not re-ask when the selected window is clicked again', () => {
      const before = healthSpy.calls.count();
      component2.setWindow('24h');

      expect(healthSpy.calls.count()).toBe(before);
    });

    it('says nothing about starting when every bot started, or when the API does not say', () => {
      expect(fixture2.nativeElement.querySelector('[data-testid="bots-not-starting"]')).toBeNull();

      healthSpy.and.returnValue(of({ ...health, bots_not_starting: null }));
      component2.setWindow('7d');
      fixture2.detectChanges();

      expect(fixture2.nativeElement.querySelector('[data-testid="bots-not-starting"]')).toBeNull();
    });

    it('names each bot that has stopped starting, with its streak, its reason and a link', () => {
      healthSpy.and.returnValue(
        of({
          ...health,
          bots_not_starting: [
            {
              crawler_id: 2029,
              name: 'pilot_24',
              consecutive: 34,
              since: '2026-11-10T12:50:33+01:00',
              latest_run_id: 58510,
              reason: 'initialisation failed - Multilogin LOCK_PROFILE_ERROR'
            },
            { crawler_id: 2036, name: null, consecutive: 1, since: null, latest_run_id: 7, reason: null }
          ]
        })
      );
      component2.setWindow('7d');
      fixture2.detectChanges();

      const notice = fixture2.nativeElement.querySelector('[data-testid="bots-not-starting"]') as HTMLElement;
      expect(notice).not.toBeNull();
      expect(notice.getAttribute('role')).toBe('alert');

      const rows = Array.from(notice.querySelectorAll('li')) as HTMLElement[];
      expect(rows.length).toBe(2);
      expect(rows[0].textContent).toContain('pilot_24');
      expect(rows[0].textContent).toContain('10 Nov');
      expect(rows[0].textContent).toContain('Multilogin LOCK_PROFILE_ERROR');
      expect(rows[0].querySelector('a')!.getAttribute('href')).toBe('/experiments/42/bots/2029');
      expect(rows[1].querySelector('a')!.getAttribute('href')).toBe('/experiments/42/bots/2036');
      expect(notice.textContent).not.toContain('undefined');
    });

    it('renders one chip per window, with the selection announced', () => {
      const chips = Array.from(fixture2.nativeElement.querySelectorAll('[data-window]')) as HTMLElement[];

      expect(chips.map((c) => c.getAttribute('data-window'))).toEqual(['24h', '7d', 'all']);
      expect(chips[0].getAttribute('aria-pressed')).toBe('true');
      expect(chips[1].getAttribute('aria-pressed')).toBe('false');
    });
  });

  /**
   * The bot pill shows the WORST run status in the window; the tooltip has to say what is
   * behind it. A count the API does not send reads as an em dash, because a tooltip is
   * exactly where a confident zero would be believed.
   */
  describe('the bot card counts', () => {
    it('lists the counts behind the pill', () => {
      const counts = component.botCounts(
        bot({
          latest_queues_count: 6,
          latest_queues_succeeded: 3,
          latest_queues_failed: 1,
          latest_queues_warning: 1,
          latest_queues_degraded: 2,
          latest_queues_treatment_lost: 1
        })
      );

      expect(counts['total']).toBe(6);
      expect(counts['succeeded']).toBe(3);
      expect(counts['failed']).toBe(1);
      expect(counts['warning']).toBe('1');
      expect(counts['degraded']).toBe('2');
      expect(counts['treatmentLost']).toBe('1');
      expect(counts['inProgress']).withContext('6 - (3 + 1 + 1)').toBe(1);
    });

    it('reports a count the API never sent as an em dash, not as zero', () => {
      const counts = component.botCounts(bot({ latest_queues_count: 2, latest_queues_succeeded: 2 }));

      expect(counts['warning']).toBe('—');
      expect(counts['degraded']).toBe('—');
      expect(counts['treatmentLost']).toBe('—');
    });

    it('never renders a negative remainder from an inconsistent rollup', () => {
      const counts = component.botCounts(
        bot({ latest_queues_count: 1, latest_queues_succeeded: 3, latest_queues_failed: 2 })
      );

      expect(counts['inProgress']).toBe(0);
    });

    it("puts the counts in the pill's tooltip and accessible name", () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: {
              entities$: of([
                { id: 251, experiment_id: 42, name: 'bot', latest_queues_count: 2, latest_queues_succeeded: 2 }
              ]),
              loading$: of(false),
              getWithQuery: () => {}
            }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      const pill = f.nativeElement.querySelector('article span[title]') as HTMLElement;

      expect(pill.getAttribute('title')).toContain('workspace.bot.runCounts');
      expect(pill.getAttribute('aria-label')).toContain('workspace.state.succeeded');
    });
  });
  /**
   * The other half of F1, left open when `latest_queues_warning` closed the `warning`
   * hole: every run the three counted buckets cannot explain.
   *
   * The API appends succeeded / failed / warning / degraded / treatment_lost / count and
   * nothing else — no skipped bucket, no running bucket, no unknown bucket. So a run the
   * runner declined to execute (`status_code = 'skipped'` **with** a `started_at`, which
   * is what `TaskManager` writes for SKIPPED_INACTIVE) and a run carrying a code nobody
   * recognises (`'skpped'`, `'cancelled'`, NULL) both land in the same remainder as a run
   * that is genuinely in flight. Rendering that remainder as a pulsing blue "Running"
   * pill asserted the one of the three readings that is both benign and, for a skipped
   * run, permanent.
   */
  describe('runs the crawler rollups cannot classify', () => {
    const renderWith = (crawlers: unknown[]): ComponentFixture<ExperimentWorkspaceComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    it('does not call a bot whose only run was skipped "Running"', () => {
      const skippedOnly = bot({
        latest_queues_count: 1,
        latest_queues_succeeded: 0,
        latest_queues_failed: 0,
        latest_queues_warning: 0,
        latest_queues_degraded: 0
      });

      expect(component.botState(skippedOnly))
        .withContext('a run that will never run must not read as one that is running')
        .toBe('unknown');
    });

    it('does the same for a run whose status_code nobody recognises', () => {
      // 'skpped' (the runner's typo) and 'cancelled' are counted by latest_queues_count
      // and by none of the outcome buckets — the same remainder, the same answer.
      const unrecognised = bot({
        latest_queues_count: 3,
        latest_queues_succeeded: 1,
        latest_queues_failed: 0,
        latest_queues_warning: 0,
        latest_queues_degraded: 0
      });

      expect(component.botState(unrecognised)).toBe('unknown');
    });

    it('keeps succeeded, warning, failed and idle exactly as they were', () => {
      expect(component.botState(bot({ latest_queues_count: 2, latest_queues_succeeded: 2 }))).toBe('succeeded');
      expect(
        component.botState(bot({ latest_queues_count: 2, latest_queues_succeeded: 1, latest_queues_warning: 1 }))
      ).toBe('warning');
      expect(
        component.botState(bot({ latest_queues_count: 2, latest_queues_succeeded: 1, latest_queues_failed: 1 }))
      ).toBe('failed');
      expect(component.botState(bot({}))).toBe('idle');
    });

    it('renders the pill as neutral grey, with no pulse and no "Running" label', () => {
      const f = renderWith([
        { id: 251, experiment_id: 42, name: 'skipped bot', latest_queues_count: 1, latest_queues_succeeded: 0 }
      ]);
      const pill = f.nativeElement.querySelector('article span[title]') as HTMLElement;

      expect(pill.textContent).toContain('workspace.state.unknown');
      expect(pill.textContent).not.toContain('workspace.state.running');
      expect(pill.className).toContain('bg-surface-3');
      expect(pill.innerHTML).withContext('nothing is in flight, so nothing pulses').not.toContain('animate-pulse-soft');
      expect(pill.innerHTML).not.toContain('bg-info');
    });
  });

  /**
   * Finding 26: "Needs attention" was `latest_queues_warning + latest_queues_degraded`.
   *
   * Those two counts overlap without either containing the other — the API side of this
   * same change set says so in as many words and forbids the sum — so a bot whose runs
   * each ended `DONE_JOBSWARNING` was counted twice and the tile read 10 beside a "Runs 5"
   * tile. The figure is now the greater of the two per bot, summed across bots (whose runs
   * cannot overlap), with both components still rendered beside it.
   */
  describe('the "Needs attention" arithmetic', () => {
    const renderWith = (crawlers: unknown[]): ComponentFixture<ExperimentWorkspaceComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } },
          { provide: ExperimentHealthApiService, useValue: { health: () => of(null) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    const tile = (f: ComponentFixture<unknown>, key: string): HTMLElement | undefined =>
      Array.from(f.nativeElement.querySelectorAll('section div.bg-surface') as NodeListOf<HTMLElement>).find((el) =>
        el.textContent?.includes(key)
      );

    const tileValue = (f: ComponentFixture<unknown>, key: string): string | undefined =>
      tile(f, key)?.querySelector('p:nth-of-type(2)')?.textContent?.trim();

    /** Five runs, each ended DONE_JOBSWARNING: both counts describe the same five runs. */
    const doubleCounted = () =>
      bot({
        latest_queues_count: 5,
        latest_queues_succeeded: 0,
        latest_queues_warning: 5,
        latest_queues_degraded: 5
      });

    it('does not count a run twice for being both warning and degraded', () => {
      const summary = component.buildSummary([doubleCounted()]);

      expect(summary.needsAttention).toBe(5);
      expect(summary.needsAttention)
        .withContext('a figure larger than the run count beside it is unactionable')
        .toBeLessThanOrEqual(summary.total);
    });

    it('keeps both components readable rather than only their combination', () => {
      const summary = component.buildSummary([doubleCounted()]);

      expect(summary.warning).toBe(5);
      expect(summary.degraded).toBe(5);
    });

    it('still adds up across bots, whose runs cannot be the same runs', () => {
      const summary = component.buildSummary([
        bot({ id: 1, latest_queues_count: 2, latest_queues_succeeded: 1, latest_queues_warning: 1 }),
        bot({ id: 2, latest_queues_count: 2, latest_queues_succeeded: 0, latest_queues_degraded: 2 })
      ]);

      expect(summary.needsAttention).toBe(3);
    });

    it('never reports more runs needing attention than the bot has runs', () => {
      expect(
        component.botNeedsAttention(
          bot({ latest_queues_count: 1, latest_queues_warning: 1, latest_queues_degraded: 1 })
        )
      ).toBe(1);
    });

    it('renders a tile that cannot exceed the runs tile', () => {
      const f = renderWith([
        {
          id: 251,
          experiment_id: 42,
          name: 'degraded bot',
          latest_queues_count: 5,
          latest_queues_succeeded: 0,
          latest_queues_warning: 5,
          latest_queues_degraded: 5
        }
      ]);

      expect(tileValue(f, 'workspace.stat.runs')).toBe('5');
      expect(tileValue(f, 'workspace.stat.needsAttention')).toBe('5');
      // The composition is still on the card, so "5" is never mistaken for one component.
      expect(f.nativeElement.textContent).toContain('workspace.stat.needsAttentionSplit');
    });
  });
});
