import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY, of, Subject } from 'rxjs';

import { EntityOp } from '@ngrx/data';

import { BotDetailComponent } from './bot-detail.component';
import { CrawlerService, QueueService } from '@app/entity/service';
import { Queue } from '@app/queue/model/queue';
import { VisibilityService } from '@shared/service/visibility.service';

/**
 * Slice B acceptance (docs/specs/runs-and-bots.md §5): a run's status is shown honestly —
 * scheduled / running / succeeded / failed.
 */
describe('BotDetailComponent (Slice B — run status)', () => {
  let component: BotDetailComponent;
  let fixture: ComponentFixture<BotDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
        {
          provide: QueueService,
          useValue: {
            entities$: of([]),
            loading$: of(false),
            getWithQuery: () => {},
            clearCache: () => {},
            errors$: EMPTY
          }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BotDetailComponent);
    component = fixture.componentInstance;
  });

  const run = (over: Partial<Queue>): Queue => ({ id: 1, crawler_id: 1, ...over }) as Queue;

  it('maps a run with no start and no status to "scheduled"', () => {
    expect(component.runState(run({ status_code: '', started_at: '' }))).toBe('scheduled');
  });

  it('maps a started run to "running"', () => {
    expect(component.runState(run({ status_code: '', started_at: '2026-08-01T09:00:00Z' }))).toBe('running');
  });

  it('maps status_code success/failure to succeeded/failed', () => {
    expect(component.runState(run({ status_code: 'success' }))).toBe('succeeded');
    expect(component.runState(run({ status_code: 'failure' }))).toBe('failed');
  });

  it('maps the runner\'s "skpped" typo to skipped, not to scheduled', () => {
    expect(component.runState(run({ status_code: 'skpped' }))).toBe('skipped');
  });

  /**
   * `docs/integration-contract.md` §3.4: "An unrecognised value must be treated as
   * **unknown**, never coerced to success." This screen used to coerce it to `scheduled`,
   * which is worse than success in one respect — it says the run has not started, so
   * nobody goes looking. The API validates nothing on `status_code` (no `in:` rule), the
   * OpenAPI annotation on the runner endpoint still documents a sixth vocabulary
   * (`pending`, `cancelled`, …) that matches nothing, and the runner can add a state
   * tomorrow, so this is reachable, not theoretical.
   */
  describe('a status_code the contract does not know', () => {
    for (const strange of ['cancelled', 'pending', 'aborted', 'wat']) {
      it(`maps "${strange}" to unknown, not to scheduled`, () => {
        expect(component.runState(run({ status_code: strange }))).toBe('unknown');
      });
    }

    it('stays unknown even when the run has started', () => {
      // `started_at` must not rescue an unrecognised code into "running" either.
      expect(component.runState(run({ status_code: 'cancelled', started_at: '2026-08-01T09:00:00Z' }))).toBe('unknown');
    });

    it('is not treated as a success, and does not borrow a success colour', () => {
      const strange = run({ status_code: 'cancelled' });

      expect(component.runState(strange)).not.toBe('succeeded');
      expect(component.runMessageClass(strange)).toBe('text-muted');
    });

    it('reserves "scheduled" for a run with no status AND no start', () => {
      expect(component.runState(run({ status_code: '', started_at: '' }))).toBe('scheduled');
      expect(component.runState(run({ status_code: null as unknown as string, started_at: '' }))).toBe('scheduled');
      // whitespace-only is still "nothing was reported"
      expect(component.runState(run({ status_code: '   ', started_at: '' }))).toBe('scheduled');
    });
  });

  /**
   * A degraded run's diagnostic used to render in the same muted grey as a healthy run's,
   * so the sentence explaining that a treatment did not apply read like boilerplate. Only
   * `failed` was coloured.
   */
  describe('the colour of the run diagnostic', () => {
    it('is red for a failure', () => {
      expect(component.runMessageClass(run({ status_code: 'failure' }))).toBe('text-danger');
      expect(component.runMessageClass(run({ status_code: 'failed' }))).toBe('text-danger');
    });

    it('is amber for a warning — queue-level and job-derived alike', () => {
      expect(component.runMessageClass(run({ status_code: 'warning' }))).toBe('text-warning');
      expect(component.runMessageClass(run({ status_code: 'success', jobs_count: 10, jobs_warning_count: 2 }))).toBe(
        'text-warning'
      );
    });

    it('stays muted for the states that need no attention', () => {
      expect(component.runMessageClass(run({ status_code: 'success' }))).toBe('text-muted');
      expect(component.runMessageClass(run({ status_code: 'skipped' }))).toBe('text-muted');
      expect(component.runMessageClass(run({ status_code: 'running' }))).toBe('text-muted');
    });
  });

  /**
   * The runner's own `status_message` and the API's per-job rollup are two accounts of the
   * same run and can disagree. The message is what was recorded; the rollup is counted
   * afterwards. The message therefore leads.
   */
  describe('the run diagnostic and the reconstructed rollup', () => {
    it('renders the runner message above the rollup, and the rollup subordinate to it', () => {
      const q845 = run({
        id: 845,
        status_code: 'success',
        status_message: 'done',
        jobs_count: 113,
        jobs_succeeded_count: 69,
        jobs_failed_count: 22,
        jobs_skipped_count: 22
      });

      expect(component.runMessage(q845)).toBe('done');
      expect(component.hasJobCounts(q845)).toBeTrue();
      // The rollup escalates the pill; the message stays the primary sentence.
      expect(component.runState(q845)).toBe('failed');
      expect(component.runMessageClass(q845)).toBe('text-danger');
    });

    it('never renders the literal "null" when the API sent no message', () => {
      expect(component.runMessage(run({ status_code: 'success', status_message: null }))).toBe('');
    });
  });

  /**
   * The runner's status_code reports the JOBLIST's outcome: it says 'success' as soon as
   * the list was worked through, whatever became of the individual jobs. Queue 845 in the
   * live database is exactly that — status_code 'success', status_message 'done', and 22
   * of its 113 jobs failed. A green "Succeeded" pill there misrepresents the data.
   */
  describe('a run the runner called "success"', () => {
    it('escalates to failed when jobs failed (live queue 845: 22 of 113)', () => {
      const q845 = run({
        status_code: 'success',
        status_message: 'done',
        jobs_count: 113,
        jobs_succeeded_count: 69,
        jobs_warning_count: 0,
        jobs_failed_count: 22,
        jobs_skipped_count: 22
      });

      expect(component.runState(q845)).toBe('failed');
      expect(component.failedJobs(q845)).toBe(22);
      expect(component.succeededJobs(q845)).toBe(69);
      expect(component.totalJobs(q845)).toBe(113);
      expect(component.hasJobCounts(q845)).toBeTrue();
    });

    it('escalates to warning when jobs merely degraded', () => {
      expect(component.runState(run({ status_code: 'success', jobs_count: 10, jobs_warning_count: 3 }))).toBe(
        'warning'
      );
    });

    it('ranks a failure above a degradation', () => {
      expect(
        component.runState(run({ status_code: 'success', jobs_count: 10, jobs_warning_count: 3, jobs_failed_count: 1 }))
      ).toBe('failed');
    });

    it('stays succeeded when every job succeeded', () => {
      expect(component.runState(run({ status_code: 'success', jobs_count: 20, jobs_succeeded_count: 20 }))).toBe(
        'succeeded'
      );
    });

    // An API older than the rollup sends no jobs_* fields at all. "Unknown" must not be
    // read as "22 failures", nor the counts line rendered as a confident 0/0.
    it('trusts the runner when the API sends no rollup', () => {
      const legacy = run({ status_code: 'success' });

      expect(component.runState(legacy)).toBe('succeeded');
      expect(component.hasJobCounts(legacy)).toBeFalse();
    });
  });

  /**
   * Rendered, because the states above are only worth anything if the template agrees.
   * Boots the component with a real run list, as the API would deliver it.
   */
  describe('the run list, rendered', () => {
    const renderRuns = (runs: unknown[]): ComponentFixture<BotDetailComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
          {
            provide: QueueService,
            useValue: {
              entities$: of(runs),
              loading$: of(false),
              getWithQuery: () => {},
              clearCache: () => {},
              errors$: EMPTY
            }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
        ]
      });
      const f = TestBed.createComponent(BotDetailComponent);
      // The route ids are assigned inside bot$'s switchMap, i.e. part-way through the
      // first change-detection pass, while the back-link's routerLink above it has already
      // read them as undefined. Seeding them keeps that pre-existing NG0100 out of these
      // tests, which are about the run list rather than about route wiring.
      f.componentInstance.experimentId = 1;
      f.componentInstance.botId = 1;
      f.detectChanges();
      return f;
    };

    it('renders an unrecognised status as the neutral Unknown pill', () => {
      const f = renderRuns([{ id: 7, crawler_id: 1, name: 'Run 7', status_code: 'cancelled' }]);
      const pill = f.nativeElement.querySelector('span[role="img"]') as HTMLElement;

      expect(f.nativeElement.textContent).toContain('workspace.runState.unknown');
      expect(f.nativeElement.textContent).not.toContain('workspace.runState.scheduled');
      expect(pill.className).withContext('neutral grey, as the shared pill uses').toContain('bg-surface-3');
      expect(pill.className).not.toContain('bg-success-tint');
      expect(pill.className).not.toContain('bg-info-tint');
      // ...and the accessible name says so rather than staying silent.
      expect(pill.getAttribute('aria-label')).toContain('workspace.runState.unknown');
    });

    /**
     * The rule `StatusComponent.ariaMessageSuffix` enforces on the shared pill, applied to
     * the hand-rolled one, and for the same reason: the diagnostic is rendered beside the
     * pill by `app-status-message` under exactly this condition, as focusable content
     * carrying a link and two buttons. Appending it to the pill's accessible name made a
     * screen reader read the whole message — up to the runner's 1800-character cap — twice
     * for every run in the list.
     */
    it('announces the state alone when the diagnostic is on screen beside it', () => {
      const message = 'completed with lost jobs - 23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)';
      const f = renderRuns([
        { id: 11, crawler_id: 1, name: 'Run 11', status_code: 'warning', status_message: message }
      ]);
      const pill = f.nativeElement.querySelector('span[role="img"]') as HTMLElement;
      const label = pill.getAttribute('aria-label') ?? '';

      expect(label).toContain('workspace.runState.warning');
      expect(label).not.toContain('23/29 jobs succeeded');
      expect(label).not.toContain('completed with lost jobs');
      // It stays reachable: rendered as real text, and kept in the pill's own tooltip.
      expect(f.nativeElement.querySelector('[data-testid="status-message-head"]')?.textContent).toContain(
        'completed with lost jobs'
      );
      expect(pill.getAttribute('title')).toContain('completed with lost jobs');
    });

    it("colours a degraded run's diagnostic amber and a failed one red", () => {
      const f = renderRuns([
        { id: 8, crawler_id: 1, name: 'Degraded run', status_code: 'warning', status_message: 'lost 3 jobs' },
        { id: 9, crawler_id: 1, name: 'Failed run', status_code: 'failure', status_message: 'browser died' }
      ]);
      // The message is rendered through `app-status-message` now: first clause visible,
      // the rest behind a disclosure, tinted with the run's severity.
      const messages = Array.from(
        f.nativeElement.querySelectorAll('[data-testid="status-message-head"]') as NodeListOf<HTMLElement>
      );

      const degraded = messages.find((el) => el.textContent?.includes('lost 3 jobs'));
      const failed = messages.find((el) => el.textContent?.includes('browser died'));

      expect(degraded).withContext("the degraded run's message is rendered").toBeDefined();
      expect(degraded!.className).toContain('text-warning');
      expect(degraded!.className).not.toContain('text-muted');
      expect(failed!.className).toContain('text-danger');
    });

    it('puts the runner message above the reconstructed rollup', () => {
      const f = renderRuns([
        {
          id: 845,
          crawler_id: 1,
          name: 'Run 845',
          status_code: 'success',
          status_message: 'done',
          jobs_count: 113,
          jobs_succeeded_count: 69,
          jobs_failed_count: 22,
          jobs_skipped_count: 22
        }
      ]);
      const html: string = f.nativeElement.innerHTML;

      expect(html.indexOf('done')).toBeGreaterThan(-1);
      expect(html.indexOf('workspace.runState.jobsSucceeded')).toBeGreaterThan(-1);
      expect(html.indexOf('done'))
        .withContext("the run's own message comes before the rollup counted from its jobs")
        .toBeLessThan(html.indexOf('workspace.runState.jobsSucceeded'));
    });
  });
  /**
   * Phase 4 — the run-level treatment-loss alarm, fed by `jobs_treatment_lost_count`.
   *
   * The case that matters is the one that looks fine: a run whose own status is
   * `success`, whose jobs all succeeded, and whose bot nevertheless produced control-arm
   * data. Nothing else on this screen can say so.
   */
  describe('treatment loss on a run', () => {
    const renderRuns = (runs: unknown[]): ComponentFixture<BotDetailComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
          {
            provide: QueueService,
            useValue: {
              entities$: of(runs),
              loading$: of(false),
              getWithQuery: () => {},
              clearCache: () => {},
              errors$: EMPTY
            }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
        ]
      });
      const f = TestBed.createComponent(BotDetailComponent);
      f.componentInstance.experimentId = 1;
      f.componentInstance.botId = 1;
      f.detectChanges();
      return f;
    };

    it('reads jobs_treatment_lost_count off a run', () => {
      expect(component.treatmentLostJobs(run({ jobs_treatment_lost_count: 3 }))).toBe(3);
      expect(component.decisionDegradedJobs(run({ jobs_degraded_count: 2 }))).toBe(2);
    });

    it('reads an absent count as 0 rather than NaN', () => {
      expect(component.treatmentLostJobs(run({}))).toBe(0);
    });

    it('raises a red alarm above the run list, ahead of every generic warning', () => {
      const f = renderRuns([
        {
          id: 900,
          crawler_id: 1,
          name: 'Green run that lost its treatment',
          status_code: 'success',
          status_message: 'done',
          jobs_count: 40,
          jobs_succeeded_count: 40,
          jobs_treatment_lost_count: 4
        }
      ]);
      const alert = f.nativeElement.querySelector('[role="alert"]') as HTMLElement;

      expect(alert).withContext('the alarm is rendered').not.toBeNull();
      expect(alert.textContent).toContain('decision.alarm.runs');
      expect(alert.className).toContain('text-danger');

      const html: string = f.nativeElement.innerHTML;
      expect(html.indexOf('decision.alarm.runs'))
        .withContext('the alarm comes before the run list it summarises')
        .toBeLessThan(html.indexOf('workspace.sections.runs'));
      // ...and the run itself is marked, above its status rollup.
      expect(html.indexOf('decision.alarm.runJobs')).toBeLessThan(html.indexOf('workspace.runState.jobsSucceeded'));
    });

    it('says nothing at zero — a nullable column cannot assert a clean bill of health', () => {
      const f = renderRuns([
        {
          id: 901,
          crawler_id: 1,
          name: 'Run',
          status_code: 'success',
          jobs_count: 40,
          jobs_succeeded_count: 40,
          jobs_treatment_lost_count: 0
        }
      ]);

      expect(f.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(f.nativeElement.textContent).not.toContain('decision.alarm');
    });

    it('shows the degraded line only when nothing was lost outright', () => {
      const f = renderRuns([
        { id: 902, crawler_id: 1, name: 'Partly degraded', status_code: 'success', jobs_degraded_count: 2 },
        {
          id: 903,
          crawler_id: 1,
          name: 'Lost',
          status_code: 'success',
          jobs_degraded_count: 3,
          jobs_treatment_lost_count: 3
        }
      ]);
      const html: string = f.nativeElement.innerHTML;

      expect(html).toContain('decision.alarm.degradedJobs');
      expect(html).toContain('decision.alarm.runJobs');
      // The lost run shows the red line, not the amber one, so the two do not compete.
      const lostCard = Array.from(f.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>).find((el) =>
        el.textContent?.includes('Lost')
      ) as HTMLElement;
      expect(lostCard.textContent).toContain('decision.alarm.runJobs');
      expect(lostCard.textContent).not.toContain('decision.alarm.degradedJobs');
    });

    it('leaves the run pill alone — the status and the verdict are different questions', () => {
      // A run can be a perfectly ordinary success and still have lost its treatment; the
      // pill reports the run, the alarm reports the science.
      expect(component.runState(run({ status_code: 'success', jobs_treatment_lost_count: 4 }))).toBe('succeeded');
    });
  });
});

/**
 * Phase 2 — the status chips on the run list.
 *
 * The screen's job is to answer "which of this bot's runs should I look at?" before being
 * asked, so it opens on "Needs attention" when there is anything to attend to. The two
 * traps this pins down:
 *
 * - the chip has to ask `filter[bad]=1` rather than list codes, because the alias table
 *   lives on the API and the list here would be a stale second copy of it;
 * - the auto-default has to be keyed on the run's OWN `status_code` — the same predicate
 *   the server applies — and not on `runState()`, which escalates a `success` run with
 *   failed jobs. Defaulting on the richer verdict would switch the view to a filter that
 *   then excludes the very run that triggered it, leaving an empty list.
 */
describe('BotDetailComponent (Phase 2 — the run status chips)', () => {
  let getWithQuery: jasmine.Spy;
  let clearCache: jasmine.Spy;
  let errors$: Subject<unknown>;

  const boot = (runs: unknown[]): ComponentFixture<BotDetailComponent> => {
    TestBed.resetTestingModule();
    getWithQuery = jasmine.createSpy('getWithQuery');
    clearCache = jasmine.createSpy('clearCache');
    errors$ = new Subject<unknown>();

    TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
        {
          provide: QueueService,
          useValue: { entities$: of(runs), loading$: of(false), getWithQuery, clearCache, errors$: errors$ }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
      ]
    });

    const f = TestBed.createComponent(BotDetailComponent);
    f.componentInstance.experimentId = 1;
    f.componentInstance.botId = 1;
    f.detectChanges();
    return f;
  };

  const lastQuery = (): Record<string, unknown> => getWithQuery.calls.mostRecent().args[0] as Record<string, unknown>;

  it('opens on "All" for a bot whose runs are all fine, and asks for no status', () => {
    const f = boot([{ id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' }]);

    expect(f.componentInstance.statusFilter).toBe('all');
    expect(lastQuery()['filter[bad]']).toBeUndefined();
    expect(lastQuery()['filter[crawler]']).toBe('1');
  });

  it('opens on "Needs attention" when the bot has a bad run', () => {
    const f = boot([
      { id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' },
      { id: 2, crawler_id: 1, name: 'Degraded', status_code: 'warning' }
    ]);

    expect(f.componentInstance.statusFilter).toBe('bad');
    expect(lastQuery()['filter[bad]']).toBe('1');
    expect(lastQuery()['filter[crawler]']).toBe('1');
    expect(lastQuery()['filter[status_code]']).toBeUndefined();
  });

  it('recognises a legacy spelling as bad without ever sending it', () => {
    // 277 queues in the live database are spelled `failed`. The chip still asks the
    // question rather than naming the spelling.
    const f = boot([{ id: 3, crawler_id: 1, name: 'Legacy failure', status_code: 'failed' }]);

    expect(f.componentInstance.statusFilter).toBe('bad');
    expect(JSON.stringify(lastQuery())).not.toContain('failed');
  });

  it('does NOT auto-focus on a run that is only bad by its job rollup', () => {
    // `filter[bad]` matches the run's OWN status_code, so defaulting to it here would hide
    // this very run: queue 845 is recorded 'success' and only its jobs say otherwise. It
    // stays on "All", where the run is visible and its pill still reads failed.
    const q845 = {
      id: 845,
      crawler_id: 1,
      name: 'Green run with 22 dead jobs',
      status_code: 'success',
      jobs_count: 113,
      jobs_succeeded_count: 69,
      jobs_failed_count: 22
    } as Queue;
    const f = boot([q845]);

    expect(f.componentInstance.runState(q845)).toBe('failed');
    expect(f.componentInstance.statusFilter).toBe('all');
    expect(lastQuery()['filter[bad]']).toBeUndefined();
  });

  it('does not auto-focus on an unknown status either — unknown is not "bad", it is unknown', () => {
    const f = boot([{ id: 4, crawler_id: 1, name: 'Strange', status_code: 'cancelled' }]);

    expect(f.componentInstance.statusFilter).toBe('all');
  });

  it('re-queries with the chosen code when the user picks a chip', () => {
    const f = boot([{ id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' }]);
    f.componentInstance.onStatusFilter('failure');

    expect(lastQuery()['filter[status_code]']).toBe('failure');
    expect(lastQuery()['filter[crawler]']).toBe('1');
    expect(lastQuery()['filter[bad]']).toBeUndefined();
  });

  it('retires the auto-default once the user has chosen, so a later load cannot override them', () => {
    // Boot with a bad run so the default fires, then have the user ask for everything.
    const f = boot([{ id: 2, crawler_id: 1, name: 'Degraded', status_code: 'warning' }]);
    expect(f.componentInstance.statusFilter).toBe('bad');

    f.componentInstance.onStatusFilter('all');
    f.detectChanges();

    // The bad run is still in the list; the default must not grab the view back.
    expect(f.componentInstance.statusFilter).toBe('all');
    expect(lastQuery()['filter[bad]']).toBeUndefined();
  });

  it('clears the cache before each load, so a wider result cannot linger under a narrower filter', () => {
    const f = boot([{ id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' }]);
    clearCache.calls.reset();
    f.componentInstance.onStatusFilter('warning');

    expect(clearCache).toHaveBeenCalled();
    expect(getWithQuery.calls.count()).toBeGreaterThan(0);
  });

  it('renders the chips as a keyboard-operable radio group', () => {
    const f = boot([{ id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' }]);
    const el = f.nativeElement as HTMLElement;

    expect(el.querySelectorAll('[data-status-filter]').length).toBe(7);
    expect(el.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(el.querySelector('[data-status-filter="all"]')!.getAttribute('aria-checked')).toBe('true');
  });

  it('distinguishes "nothing matches this filter" from "this bot has never run"', () => {
    const f = boot([]);
    f.componentInstance.onStatusFilter('failure');
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;

    expect(el.textContent).toContain('statusFilter.empty.title');
    expect(el.textContent).not.toContain('workspace.botDetail.noRuns.title');
  });

  it('keeps the "this bot has never run" state for an unfiltered empty list', () => {
    const el = boot([]).nativeElement as HTMLElement;

    expect(el.textContent).toContain('workspace.botDetail.noRuns.title');
    expect(el.textContent).not.toContain('statusFilter.empty.title');
  });
  describe('against an API that does not know filter[bad] yet', () => {
    const queryFailed = (): void => {
      errors$.next({ payload: { entityOp: EntityOp.QUERY_MANY_ERROR } });
    };

    it('steps the automatic filter back to "All" rather than leaving an empty list', () => {
      const f = boot([{ id: 2, crawler_id: 1, name: 'Degraded', status_code: 'warning' }]);
      expect(f.componentInstance.statusFilter).toBe('bad');

      queryFailed();
      f.detectChanges();

      expect(f.componentInstance.statusFilter).toBe('all');
      expect(lastQuery()['filter[bad]']).toBeUndefined();
      expect(lastQuery()['filter[crawler]']).toBe('1');
    });

    it('steps back only once, so a still-failing API cannot start a loop', () => {
      const f = boot([{ id: 2, crawler_id: 1, name: 'Degraded', status_code: 'warning' }]);
      queryFailed();
      const after = getWithQuery.calls.count();
      queryFailed();
      queryFailed();

      expect(getWithQuery.calls.count()).toBe(after);
      expect(f.componentInstance.statusFilter).toBe('all');
    });

    it('leaves a filter the user chose alone — that error is theirs to see', () => {
      const f = boot([{ id: 1, crawler_id: 1, name: 'Fine', status_code: 'success' }]);
      f.componentInstance.onStatusFilter('failure');
      queryFailed();

      expect(f.componentInstance.statusFilter).toBe('failure');
    });

    it('ignores an error from some other operation', () => {
      const f = boot([{ id: 2, crawler_id: 1, name: 'Degraded', status_code: 'warning' }]);
      errors$.next({ payload: { entityOp: EntityOp.SAVE_DELETE_ONE_ERROR } });

      expect(f.componentInstance.statusFilter).toBe('bad');
    });
  });
});

/**
 * Phase 5 — liveness and the transition alarm.
 *
 * Nothing in this app refreshed: a run that finished (or failed) while its bot's page was
 * open kept its blue "Running" pill until the reader navigated away and back. This block
 * pins the four properties that make a poll safe to add — it starts only when something is
 * running, stops when nothing is, pauses behind a hidden tab, and dies with the component
 * — plus the rule that keeps the resulting toast worth reading: it fires on the
 * transition, not on the state.
 */
describe('BotDetailComponent (Phase 5 — liveness and transition alarms)', () => {
  let fixture: ComponentFixture<BotDetailComponent>;
  let component: BotDetailComponent;
  let entities$: BehaviorSubject<Queue[]>;
  let visible$: BehaviorSubject<boolean>;
  let getWithQuery: jasmine.Spy;

  const POLL = 15000;
  const run = (over: Partial<Queue>): Queue => ({ id: 1, crawler_id: 1, name: 'Run', ...over }) as Queue;

  beforeEach(async () => {
    entities$ = new BehaviorSubject<Queue[]>([]);
    visible$ = new BehaviorSubject<boolean>(true);
    getWithQuery = jasmine.createSpy('getWithQuery');

    await TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
        {
          provide: QueueService,
          useValue: { entities$, loading$: of(false), getWithQuery, clearCache: () => {}, errors$: EMPTY }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } },
        { provide: VisibilityService, useValue: { visible$ } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BotDetailComponent);
    component = fixture.componentInstance;
  });

  /** Render, then report how many run queries have been issued so far. */
  const start = (runs: Queue[]): number => {
    entities$.next(runs);
    // Same seeding as the run-list block above: the route ids are assigned inside bot$'s
    // switchMap, after the back-link's routerLink has already read them, and that
    // pre-existing NG0100 is not what these tests are about.
    fixture.componentInstance.experimentId = 1;
    fixture.componentInstance.botId = 1;
    fixture.detectChanges();
    return getWithQuery.calls.count();
  };

  describe('polling', () => {
    it('does not poll while nothing is running', fakeAsync(() => {
      const initial = start([run({ id: 1, status_code: 'success' })]);

      tick(POLL * 4);

      expect(getWithQuery.calls.count()).withContext('a settled list must not poll').toBe(initial);
      fixture.destroy();
    }));

    it('re-reads the list every 15 s while a run is running', fakeAsync(() => {
      const initial = start([run({ id: 1, status_code: 'running' })]);

      tick(POLL);
      expect(getWithQuery.calls.count()).toBe(initial + 1);

      tick(POLL);
      expect(getWithQuery.calls.count()).toBe(initial + 2);

      fixture.destroy();
    }));

    it('refreshes without clearing the cache, so the list does not blink every 15 s', fakeAsync(() => {
      const clearCache = spyOn(TestBed.inject(QueueService), 'clearCache');
      start([run({ id: 1, status_code: 'running' })]);
      clearCache.calls.reset();

      tick(POLL * 2);

      expect(clearCache).not.toHaveBeenCalled();
      fixture.destroy();
    }));

    it('stops as soon as the run finishes', fakeAsync(() => {
      const initial = start([run({ id: 1, status_code: 'running' })]);
      tick(POLL);
      expect(getWithQuery.calls.count()).toBe(initial + 1);

      entities$.next([run({ id: 1, status_code: 'success' })]);
      tick(POLL * 5);

      expect(getWithQuery.calls.count())
        .withContext('nothing running, nothing polling')
        .toBe(initial + 1);
      fixture.destroy();
    }));

    it('pauses while the tab is hidden and resumes when it comes back', fakeAsync(() => {
      const initial = start([run({ id: 1, status_code: 'running' })]);

      visible$.next(false);
      tick(POLL * 5);
      expect(getWithQuery.calls.count()).withContext('a background tab must not poll').toBe(initial);

      visible$.next(true);
      tick(POLL);
      expect(getWithQuery.calls.count()).toBe(initial + 1);

      fixture.destroy();
    }));

    /**
     * The one that matters most. A leaked interval in a single-page app outlives the
     * screen that created it and keeps calling a destroyed component's code for the rest
     * of the session; `fakeAsync` also fails the test outright on a timer still pending
     * when the zone ends, so this asserts it twice over.
     */
    it('tears the timer down on destroy', fakeAsync(() => {
      const initial = start([run({ id: 1, status_code: 'running' })]);
      tick(POLL);
      const afterOneTick = getWithQuery.calls.count();
      expect(afterOneTick).toBe(initial + 1);

      fixture.destroy();
      tick(POLL * 10);

      expect(getWithQuery.calls.count()).toBe(afterOneTick);
    }));

    it('marks itself live only while it is actually polling', fakeAsync(() => {
      const live: boolean[] = [];
      start([run({ id: 1, status_code: 'running' })]);
      const sub = component.live$.subscribe((on) => live.push(on));

      visible$.next(false);
      entities$.next([run({ id: 1, status_code: 'success' })]);
      visible$.next(true);

      expect(live).toEqual([true, false]);
      sub.unsubscribe();
      fixture.destroy();
    }));
  });

  describe('the transition alarm', () => {
    it('stays quiet for a run that was already failed when the screen opened', () => {
      start([run({ id: 1, status_code: 'failure' })]);

      expect(component.alarm).withContext('the list already shows it in red; a toast is not news').toBeNull();
    });

    it('raises exactly one toast when a run transitions into failure', () => {
      start([run({ id: 1, name: 'Morning run', status_code: 'running' })]);

      entities$.next([run({ id: 1, name: 'Morning run', status_code: 'failure' })]);
      fixture.detectChanges();

      expect(component.alarm).toEqual({ runId: 1, runName: 'Morning run', kind: 'failure' });
      expect(fixture.nativeElement.textContent).toContain('runAlarm.failureTitle');
    });

    it('does not raise again on a repeated identical poll', () => {
      start([run({ id: 1, status_code: 'running' })]);
      const failed = [run({ id: 1, status_code: 'failure' })];
      entities$.next(failed);
      component.dismissAlarm();

      for (let poll = 0; poll < 4; poll++) {
        entities$.next([run({ id: 1, status_code: 'failure' })]);
      }
      fixture.detectChanges();

      expect(component.alarm).withContext('the same failure, observed five times, is one event').toBeNull();
    });

    it('raises on treatment loss, which no status field would have shown', () => {
      start([run({ id: 1, status_code: 'success' })]);

      entities$.next([run({ id: 1, status_code: 'success', jobs_treatment_lost_count: 2 })]);
      fixture.detectChanges();

      expect(component.alarm?.kind).toBe('treatmentLost');
      expect(component.alarmTitleKey).toBe('runAlarm.treatmentLostTitle');
      expect(fixture.nativeElement.textContent).toContain('runAlarm.treatmentLostTitle');
    });

    it('does not raise for a run that merely degrades', () => {
      start([run({ id: 1, status_code: 'running' })]);

      entities$.next([run({ id: 1, status_code: 'warning' })]);
      fixture.detectChanges();

      expect(component.alarm).withContext('a warning is a colour and a filter, not an interruption').toBeNull();
    });

    it('can be dismissed without changing the run', () => {
      start([run({ id: 1, status_code: 'running' })]);
      entities$.next([run({ id: 1, status_code: 'failure' })]);
      fixture.detectChanges();
      expect(component.alarm).not.toBeNull();

      component.dismissAlarm();
      fixture.detectChanges();

      expect(component.alarm).toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('runAlarm.failureTitle');
    });
  });
});
