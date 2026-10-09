import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { RunComposerComponent } from './run-composer.component';
import { BehaviorService, JobService, QueueService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';
import { DecisionApiService } from '@app/job/service/decision-api.service';
import { Queue } from '@app/queue/model/queue';
import { VisibilityService } from '@shared/service/visibility.service';

/**
 * Slice C acceptance (docs/specs/runs-and-bots.md §5):
 *  - adding a Job POSTs with queue_id + next order, AND its type-specific fields become
 *    Behaviours (POSTed with the new job_id).
 *  - a required type field blocks the add.
 *  - reorder / toggle-active / remove persist via PUT / PUT / DELETE.
 */
describe('RunComposerComponent (Slice C — compose job sequence)', () => {
  let component: RunComposerComponent;
  let fixture: ComponentFixture<RunComposerComponent>;
  let jobAdd: jasmine.Spy, jobUpdate: jasmine.Spy, jobDelete: jasmine.Spy, behaviorAdd: jasmine.Spy;

  const job = (over: Partial<Job>): Job => ({ id: 0, queue_id: 9, order: 0, active: 1, ...over }) as Job;

  beforeEach(async () => {
    jobAdd = jasmine.createSpy('add').and.callFake((j: any) => of({ id: 100, ...j }));
    jobUpdate = jasmine.createSpy('update').and.callFake((j: any) => of(j));
    jobDelete = jasmine.createSpy('delete').and.returnValue(of(1));
    behaviorAdd = jasmine.createSpy('add').and.callFake((b: any) => of({ id: 500, ...b }));

    await TestBed.configureTestingModule({
      imports: [RunComposerComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: JobService,
          useValue: {
            entities$: of([]),
            loading$: of(false),
            getWithQuery: () => {},
            add: jobAdd,
            update: jobUpdate,
            delete: jobDelete
          }
        },
        { provide: BehaviorService, useValue: { add: behaviorAdd, entities$: of([]), getWithQuery: () => of([]) } },
        { provide: QueueService, useValue: { getByKey: () => of({ id: 9, name: 'Run' }) } },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'runId' ? '9' : '1') }) } },
        // The per-job decision expander reaches the API for the raw payload; stubbed so
        // this spec does not need the HTTP stack to render a job list.
        {
          provide: DecisionApiService,
          useValue: { decisionUrl: (id: number) => `/api/v1/jobs/${id}/decision`, fetchDecision: () => of({}) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
    component.runId = 9;
  });

  it('sends the optional job description with the job (F6)', () => {
    component.jobs = [];
    component.addForm.patchValue({ type: 'waitjob' });
    component.onTypeChange();
    component.addForm.patchValue({ name: 'Wait for consent page', description: 'Wait for consent page to load' });
    component.fieldsForm.patchValue({ seconds: '3' });
    component.addJob();

    expect(jobAdd.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ name: 'Wait for consent page', description: 'Wait for consent page to load' })
    );
  });

  it('adds a job with the next order and creates its type fields as behaviours', () => {
    component.jobs = [job({ id: 1, order: 1 })];
    component.addForm.patchValue({ type: 'visitjob' });
    component.onTypeChange(); // builds the visitjob fields (url required, captchaMode default 'never')
    component.addForm.patchValue({ name: 'Open home' });
    component.fieldsForm.patchValue({ url: 'https://youtube.com' });
    component.addJob();

    expect(jobAdd).toHaveBeenCalledTimes(1);
    expect(jobAdd.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ queue_id: 9, type: 'visitjob', name: 'Open home', order: 2, previous_job_id: 1 })
    );
    // url + captchaMode(default) become behaviours on job 100
    const behaviourArgs = behaviorAdd.calls.allArgs().map(([b]) => [b.name, b.value, b.job_id]);
    expect(behaviourArgs).toContain(['url', 'https://youtube.com', 100]);
    expect(behaviourArgs).toContain(['captchaMode', 'never', 100]);
  });

  it('blocks the add when a required type field is empty', () => {
    component.addForm.patchValue({ type: 'visitjob', name: 'Open home' });
    component.onTypeChange();
    component.fieldsForm.patchValue({ url: '' }); // required url missing
    component.addJob();
    expect(jobAdd).not.toHaveBeenCalled();
  });

  it('does not add a job when name/type are missing', () => {
    component.addForm.patchValue({ name: '', type: null });
    component.addJob();
    expect(jobAdd).not.toHaveBeenCalled();
    expect(component.addForm.touched).toBeTrue();
  });

  it('moves a job up by swapping order with its predecessor (two PUTs)', () => {
    const a = job({ id: 1, order: 1 });
    const b = job({ id: 2, order: 2 });
    component.jobs = [a, b];
    component.moveUp(b);

    expect(jobUpdate).toHaveBeenCalledTimes(2);
    const orders = jobUpdate.calls
      .allArgs()
      .map(([j]) => [j.id, j.order])
      .sort();
    expect(orders).toEqual([
      [1, 2],
      [2, 1]
    ]);
  });

  it('reorders by position even when orders currently collide (legacy duplicate orders)', () => {
    // both jobs have order=1 — swapping raw values would be a no-op; position-based renumber fixes it
    const a = job({ id: 1, order: 1 });
    const b = job({ id: 2, order: 1 });
    component.jobs = [a, b];
    component.moveUp(b); // b should become position 1, a position 2

    const puts = jobUpdate.calls.allArgs().map(([j]) => [j.id, j.order]);
    // a (was 1) must be renumbered to 2 so the two are now distinct and b sits first
    expect(puts).toContain([1, 2]);
    expect(component.jobs.map((j) => j.id)).toEqual([1, 2]); // pre-reload local state unchanged; server reload reflects new order
  });

  it('toggles active via PUT with the flipped value', () => {
    component.toggleActive(job({ id: 5, active: 1 }));
    expect(jobUpdate).toHaveBeenCalledWith(jasmine.objectContaining({ id: 5, active: 0 }));
  });

  it('removes a job via DELETE', () => {
    component.removeJob(job({ id: 7 }));
    expect(jobDelete).toHaveBeenCalledWith(7);
  });

  /**
   * The tally counted every job in `total` but bucketed only the five recognised states,
   * so a job whose `status_code` the GUI did not recognise vanished from the breakdown
   * while still inflating the total: "3 succeeded" out of 4, with the fourth never
   * mentioned. `docs/integration-contract.md` §3.4 is explicit that an unrecognised value
   * is *unknown* and must never be dropped or folded into a benign bucket. The API
   * validates nothing on that field, so this is reachable in production.
   */
  describe('the job outcome tally', () => {
    /** Drive the private tally through the public surface the component uses itself. */
    const tallyOf = (jobs: Job[]) => {
      component.jobs = jobs;
      return (component as unknown as { tally: (j: Job[]) => any }).tally(jobs);
    };

    it('counts the five canonical states', () => {
      const counts = tallyOf([
        job({ id: 1, status_code: 'success' }),
        job({ id: 2, status_code: 'warning' }),
        job({ id: 3, status_code: 'failure' }),
        job({ id: 4, status_code: 'skipped' }),
        job({ id: 5, status_code: 'running' })
      ]);

      expect(counts).toEqual(
        jasmine.objectContaining({ total: 5, succeeded: 1, warning: 1, failed: 1, skipped: 1, running: 1, unknown: 0 })
      );
    });

    it('accepts the legacy spellings rather than calling them unknown', () => {
      const counts = tallyOf([job({ id: 1, status_code: 'failed' }), job({ id: 2, status_code: 'skpped' })]);

      expect(counts.failed).toBe(1);
      expect(counts.skipped).toBe(1);
      expect(counts.unknown).toBe(0);
    });

    it('puts an unrecognised status in the unknown bucket instead of dropping it', () => {
      const counts = tallyOf([
        job({ id: 1, status_code: 'success' }),
        job({ id: 2, status_code: 'cancelled' }),
        job({ id: 3, status_code: 'pending' })
      ]);

      expect(counts.unknown).toBe(2);
      expect(counts.succeeded).toBe(1);
      // The buckets now account for every job that reported something.
      expect(counts.succeeded + counts.warning + counts.failed + counts.skipped + counts.running + counts.unknown).toBe(
        counts.total
      );
    });

    it('never counts an unrecognised status as a success', () => {
      const counts = tallyOf([job({ id: 1, status_code: 'cancelled' })]);

      expect(counts.succeeded).toBe(0);
      expect(counts.unknown).toBe(1);
    });

    /**
     * A job that has not run has no status at all. That is "not started", not "unknown":
     * counting it here would put an amber-adjacent "N Unknown" on every run being
     * composed, which is the false-alarm trap the contract warns about.
     */
    it('does not call a job that has never run "unknown"', () => {
      const counts = tallyOf([job({ id: 1 }), job({ id: 2, status_code: '' }), job({ id: 3, status_code: '   ' })]);

      expect(counts.total).toBe(3);
      expect(counts.unknown).toBe(0);
      expect(component.hasJobOutcomes).toBeFalse();
    });

    it('renders the unknown bucket rather than hiding it', () => {
      // Route ids are assigned inside run$'s switchMap, after the back-link above has
      // already read them; seed them so the pre-existing NG0100 does not mask this test.
      component.experimentId = 1;
      component.botId = 1;
      // ngOnInit re-tallies from the (empty) entity stream, so set the counts after it.
      fixture.detectChanges();
      component.counts = tallyOf([job({ id: 1, status_code: 'success' }), job({ id: 2, status_code: 'cancelled' })]);
      fixture.detectChanges();

      expect(component.hasJobOutcomes).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain('status.unknown');
      expect(fixture.nativeElement.textContent).toContain('status.success');
    });
  });
  /**
   * Phase 4 — the decision verdict on the per-job list.
   *
   * Counted off the `decision_*` columns and kept orthogonal to `status_code` on purpose:
   * a treatment can be lost on a job that reported `success`, so bucketing the verdict
   * inside the status switch would make the two mutually exclusive when they are not.
   */
  describe('the decision verdict', () => {
    const tallyOf = (jobs: Job[]) => {
      component.jobs = jobs;
      return (component as unknown as { tally: (j: Job[]) => any }).tally(jobs);
    };

    const lambdaJob = (over: Partial<Job>): Job => job({ type: 'lambdasingleselectjob', ...over } as Partial<Job>);

    it('counts a lost treatment on a job that reported success', () => {
      const counts = tallyOf([
        lambdaJob({ id: 1, status_code: 'success', decision_treatment_lost: true, decision_degraded: true }),
        lambdaJob({ id: 2, status_code: 'success', decision_degraded: true, decision_treatment_lost: false })
      ]);

      expect(counts.treatmentLost).toBe(1);
      expect(counts.decisionDegraded).toBe(1);
      expect(counts.succeeded).withContext('the status tally is untouched').toBe(2);
    });

    it('counts nothing for a control bot that correctly picked at random', () => {
      const counts = tallyOf([
        lambdaJob({
          id: 1,
          status_code: 'success',
          decision_degraded: false,
          decision_treatment_lost: false,
          decision_selection_mode: 'random'
        })
      ]);

      expect(counts.treatmentLost).toBe(0);
      expect(counts.decisionDegraded).toBe(0);
    });

    it('counts nothing for jobs the API has told us nothing about', () => {
      // Absence is unknown, and unknown is neither an alarm nor a clean result: it is
      // surfaced per job as a grey "no verdict" mark, never as a tally number.
      const counts = tallyOf([lambdaJob({ id: 1, status_code: 'success' }), job({ id: 2, status_code: 'success' })]);

      expect(counts.treatmentLost).toBe(0);
      expect(counts.decisionDegraded).toBe(0);
    });

    it('raises the red alarm above the amber notices', () => {
      component.experimentId = 1;
      component.botId = 1;
      fixture.detectChanges();
      component.jobs = [
        lambdaJob({
          id: 1,
          name: 'Pick a video',
          status_code: 'warning',
          decision_treatment_lost: true,
          decision_degraded: true
        })
      ];
      component.counts = tallyOf(component.jobs);
      fixture.detectChanges();

      const html: string = fixture.nativeElement.innerHTML;
      expect(html).toContain('decision.alarm.jobs');
      expect(html.indexOf('decision.alarm.jobs'))
        .withContext('the alarm precedes the generic degraded notice')
        .toBeLessThan(html.indexOf('workspace.composer.degradedNotice'));
      // ...and the job row carries the badge itself.
      expect(fixture.nativeElement.querySelector('[data-decision="lost"]')).not.toBeNull();
    });

    it('marks a lambda job with no verdict as unknown, and a visit job not at all', () => {
      component.experimentId = 1;
      component.botId = 1;
      fixture.detectChanges();
      component.jobs = [
        lambdaJob({ id: 1, name: 'Pick a video', status_code: 'success' }),
        job({ id: 2, name: 'Open home', type: 'visitjob', status_code: 'success' })
      ];
      component.counts = tallyOf(component.jobs);
      fixture.detectChanges();

      const badges = fixture.nativeElement.querySelectorAll('[data-decision]') as NodeListOf<HTMLElement>;
      expect(badges.length).withContext('only the lambda job is marked').toBe(1);
      expect(badges[0].getAttribute('data-decision')).toBe('unknown');
      expect(component.showsDecision(component.jobs[0])).toBeTrue();
      expect(component.showsDecision(component.jobs[1])).toBeFalse();
    });
  });
});

/**
 * Phase 5 — liveness and the transition alarm on the run composer.
 *
 * This is the screen someone sits on while a run is going, and until now it showed them a
 * frozen snapshot: a job that finished, degraded or failed while they watched kept its
 * old pill until they navigated away and back. The poll re-reads the run **and** its jobs,
 * because the two come from different endpoints and either can be the one that changed.
 */
describe('RunComposerComponent (Phase 5 — liveness and transition alarms)', () => {
  let fixture: ComponentFixture<RunComposerComponent>;
  let component: RunComposerComponent;
  let jobs$: BehaviorSubject<Job[]>;
  let visible$: BehaviorSubject<boolean>;
  let getByKey: jasmine.Spy;
  let getJobs: jasmine.Spy;
  let currentRun: Queue;

  const POLL = 15000;
  const job = (over: Partial<Job>): Job => ({ id: 1, queue_id: 9, order: 1, active: 1, ...over }) as Job;
  const lambdaJob = (over: Partial<Job>): Job => job({ type: 'lambdasingleselectjob', ...over });

  beforeEach(async () => {
    jobs$ = new BehaviorSubject<Job[]>([]);
    visible$ = new BehaviorSubject<boolean>(true);
    currentRun = { id: 9, name: 'Run' } as Queue;
    getByKey = jasmine.createSpy('getByKey').and.callFake(() => of(currentRun));
    getJobs = jasmine.createSpy('getWithQuery');

    await TestBed.configureTestingModule({
      imports: [RunComposerComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: JobService,
          useValue: {
            entities$: jobs$,
            loading$: of(false),
            getWithQuery: getJobs,
            add: () => of({}),
            update: () => of({}),
            delete: () => of(1)
          }
        },
        { provide: BehaviorService, useValue: { add: () => of({}), entities$: of([]), getWithQuery: () => of([]) } },
        { provide: QueueService, useValue: { getByKey } },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'runId' ? '9' : '1') }) } },
        {
          provide: DecisionApiService,
          useValue: { decisionUrl: (id: number) => `/api/v1/jobs/${id}/decision`, fetchDecision: () => of({}) }
        },
        { provide: VisibilityService, useValue: { visible$ } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
  });

  describe('polling', () => {
    it('does not poll a run that has finished', fakeAsync(() => {
      currentRun = { id: 9, name: 'Run', status_code: 'success' } as Queue;
      jobs$.next([job({ id: 1, status_code: 'success' })]);
      fixture.detectChanges();
      const reads = getByKey.calls.count();

      tick(POLL * 4);

      expect(getByKey.calls.count()).toBe(reads);
      fixture.destroy();
    }));

    it('re-reads the run AND its jobs every 15 s while the run is running', fakeAsync(() => {
      currentRun = { id: 9, name: 'Run', status_code: 'running' } as Queue;
      fixture.detectChanges();
      const reads = getByKey.calls.count();
      const jobReads = getJobs.calls.count();

      tick(POLL);

      expect(getByKey.calls.count())
        .withContext('the run itself')
        .toBe(reads + 1);
      expect(getJobs.calls.count())
        .withContext('and its jobs')
        .toBe(jobReads + 1);
      fixture.destroy();
    }));

    it('polls when a job is running even though the run itself says nothing', fakeAsync(() => {
      // The run object and the job list arrive from different endpoints; either being in
      // flight is reason enough to keep looking.
      currentRun = { id: 9, name: 'Run' } as Queue;
      jobs$.next([job({ id: 1, status_code: 'running' })]);
      fixture.detectChanges();
      const reads = getByKey.calls.count();

      tick(POLL);

      expect(getByKey.calls.count()).toBe(reads + 1);
      fixture.destroy();
    }));

    it('pauses while the tab is hidden', fakeAsync(() => {
      currentRun = { id: 9, name: 'Run', status_code: 'running' } as Queue;
      fixture.detectChanges();
      const reads = getByKey.calls.count();

      visible$.next(false);
      tick(POLL * 5);
      expect(getByKey.calls.count()).toBe(reads);

      visible$.next(true);
      tick(POLL);
      expect(getByKey.calls.count()).toBe(reads + 1);

      fixture.destroy();
    }));

    it('tears the timer down on destroy', fakeAsync(() => {
      currentRun = { id: 9, name: 'Run', status_code: 'running' } as Queue;
      fixture.detectChanges();
      tick(POLL);
      const reads = getByKey.calls.count();

      fixture.destroy();
      tick(POLL * 10);

      expect(getByKey.calls.count()).toBe(reads);
    }));
  });

  describe('the transition alarm', () => {
    it('stays quiet for a run that was already failed when the screen opened', () => {
      currentRun = { id: 9, name: 'Run', status_code: 'failure' } as Queue;
      fixture.detectChanges();

      expect(component.alarm).toBeNull();
    });

    it('raises when a job on screen loses its treatment', () => {
      currentRun = { id: 9, name: 'Run', status_code: 'running' } as Queue;
      jobs$.next([lambdaJob({ id: 1, status_code: 'running' })]);
      fixture.detectChanges();

      jobs$.next([lambdaJob({ id: 1, status_code: 'success', decision_treatment_lost: true })]);
      fixture.detectChanges();

      expect(component.alarm?.kind).toBe('treatmentLost');
      expect(fixture.nativeElement.textContent).toContain('runAlarm.treatmentLostTitle');
    });

    it('does not raise again while the same lost treatment keeps being polled', () => {
      currentRun = { id: 9, name: 'Run', status_code: 'running' } as Queue;
      jobs$.next([lambdaJob({ id: 1, status_code: 'running' })]);
      fixture.detectChanges();
      jobs$.next([lambdaJob({ id: 1, status_code: 'success', decision_treatment_lost: true })]);
      fixture.detectChanges();
      component.dismissAlarm();

      for (let poll = 0; poll < 3; poll++) {
        jobs$.next([lambdaJob({ id: 1, status_code: 'success', decision_treatment_lost: true })]);
      }
      fixture.detectChanges();

      expect(component.alarm).toBeNull();
    });
  });
});

/**
 * The alarm banners against pagination.
 *
 * `loadJobs()` issues `GET /jobs?filter[queue]=<id>` with no `per_page`, and the API
 * paginates at 15. On this box 131 of 635 runs hold more than that and 96 hold 284 — so
 * `jobs` is routinely the first page of a much longer run, and a tally over it is a tally
 * over a sample. On a 284-job run whose treatment was lost on jobs 40-120 the red banner
 * did not render **at all**, on the one screen dedicated to that run, while the toast path
 * beside it read the server's whole-run count and knew perfectly well.
 */
describe('RunComposerComponent (Phase 4 — alarm counts over the whole run)', () => {
  let fixture: ComponentFixture<RunComposerComponent>;
  let component: RunComposerComponent;
  let jobs$: BehaviorSubject<Job[]>;
  let currentRun: Queue;

  const job = (over: Partial<Job>): Job => ({ id: 1, queue_id: 9, order: 1, active: 1, ...over }) as Job;

  const render = (run: Partial<Queue>, jobs: Job[]): void => {
    currentRun = { id: 9, name: 'Run', ...run } as Queue;
    // `runId` is assigned inside run$'s switchMap, which the template subscribes to only
    // after ngOnInit — by which time the jobs$ filter has already run against an undefined
    // id. Seeding it is the same shortcut the Slice C block takes.
    component.experimentId = 1;
    component.botId = 1;
    component.runId = 9;
    jobs$.next(jobs);
    fixture.detectChanges();
  };

  const el = (testId: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);

  beforeEach(async () => {
    jobs$ = new BehaviorSubject<Job[]>([]);
    currentRun = { id: 9, name: 'Run' } as Queue;

    await TestBed.configureTestingModule({
      imports: [RunComposerComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: JobService,
          useValue: {
            entities$: jobs$,
            loading$: of(false),
            getWithQuery: () => {},
            add: () => of({}),
            update: () => of({}),
            delete: () => of(1)
          }
        },
        { provide: BehaviorService, useValue: { add: () => of({}), entities$: of([]), getWithQuery: () => of([]) } },
        { provide: QueueService, useValue: { getByKey: () => of(currentRun) } },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'runId' ? '9' : '1') }) } },
        {
          provide: DecisionApiService,
          useValue: { decisionUrl: (id: number) => `/api/v1/jobs/${id}/decision`, fetchDecision: () => of({}) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
  });

  it('raises the treatment-lost banner from the run rollup when the loaded page shows none', () => {
    const page = Array.from({ length: 15 }, (_, i) => job({ id: i + 1, order: i + 1, status_code: 'success' }));

    render({ jobs_count: 284, jobs_succeeded_count: 284, jobs_treatment_lost_count: 40 }, page);

    expect(component.counts.treatmentLost).withContext('nothing on this page lost anything').toBe(0);
    expect(el('composer-treatment-lost'))
      .withContext('40 void sessions must not be invisible because they are on page 3')
      .not.toBeNull();
    expect(component.treatmentLostTotal(currentRun)).toBe(40);
  });

  it('raises the degraded banner from the run rollup for the same reason', () => {
    render({ jobs_count: 284, jobs_degraded_count: 12 }, [job({ id: 1, status_code: 'success' })]);

    expect(el('composer-decision-degraded')).not.toBeNull();
    expect(component.decisionDegradedTotal(currentRun)).toBe(12);
  });

  it('still reads the loaded jobs when the API sends no rollup at all', () => {
    // An older API: absent is unknown, and the verdicts on screen are then the only
    // evidence there is. They must not be discarded in favour of the missing count.
    render({}, [job({ id: 1, type: 'lambdasingleselectjob', status_code: 'success', decision_treatment_lost: true })]);

    expect(component.treatmentLostTotal(currentRun)).toBe(1);
    expect(el('composer-treatment-lost')).not.toBeNull();
  });

  it('says the tally covers only the jobs on screen', () => {
    const page = Array.from({ length: 15 }, (_, i) => job({ id: i + 1, order: i + 1, status_code: 'success' }));

    render({ jobs_count: 284, jobs_succeeded_count: 284 }, page);

    expect(el('composer-partial-tally')).withContext('"15 success" out of 284 is not a tally').not.toBeNull();
    expect(el('composer-partial-tally')!.textContent).toContain('workspace.composer.partialTally');
  });

  it('says nothing about truncation when the whole run is on screen', () => {
    render({ jobs_count: 2, jobs_succeeded_count: 2 }, [
      job({ id: 1, order: 1, status_code: 'success' }),
      job({ id: 2, order: 2, status_code: 'success' })
    ]);

    expect(el('composer-partial-tally')).toBeNull();
  });

  it('claims no alarm the run does not report — a zero rollup is not an alarm', () => {
    render({ jobs_count: 284, jobs_treatment_lost_count: 0, jobs_degraded_count: 0 }, [
      job({ id: 1, status_code: 'success' })
    ]);

    expect(el('composer-treatment-lost')).toBeNull();
    expect(el('composer-decision-degraded')).toBeNull();
  });
});
