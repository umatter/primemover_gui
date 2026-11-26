import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, map, of, Subject, throwError } from 'rxjs';

import { RunComposerComponent } from './run-composer.component';
import { Behavior } from '@app/behavior/behavior';
import { BehaviorService, JobService, QueueService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';
import { DecisionApiService } from '@app/job/service/decision-api.service';
import { Meta } from '@shared/pagination/model';

/**
 * F4a (docs/specs/gui-finalisation.md): a run is live from creation, so a job missing a
 * required setting is found by the runner unless the composer says so first.
 */
describe('RunComposerComponent (F4a — missing required settings)', () => {
  let fixture: ComponentFixture<RunComposerComponent>;
  let component: RunComposerComponent;
  let behaviours$: BehaviorSubject<Behavior[]>;
  let behaviourQuery: jasmine.Spy;
  let jobs$: BehaviorSubject<Job[]>;

  const job = (over: Partial<Job>): Job => ({ id: 0, queue_id: 9, order: 0, active: 1, name: 'j', ...over }) as Job;
  const behaviour = (job_id: number, name: string, active = true): Behavior =>
    ({ id: job_id * 100 + name.length, job_id, name, value: 'x', description: name, active }) as Behavior;

  const JOBS = [
    job({ id: 1, order: 1, type: 'visitjob' }),
    job({ id: 2, order: 2, type: 'waitjob' }),
    job({ id: 3, order: 3, type: 'entertextfieldjob' }),
    job({ id: 4, order: 4, type: 'teleportjob' })
  ];

  let pageMeta$: BehaviorSubject<Partial<Meta> | null>;
  let params$: BehaviorSubject<string>;

  async function create(query: () => any = () => of([])): Promise<void> {
    pageMeta$ = new BehaviorSubject<Partial<Meta> | null>(null);
    params$ = new BehaviorSubject('9');
    behaviours$ = new BehaviorSubject<Behavior[]>([
      behaviour(1, 'url'),
      behaviour(2, 'seconds', false),
      behaviour(3, 'text'),
      // another run's behaviour, cached by ngrx-data: must not satisfy anything here
      behaviour(99, 'seconds')
    ]);
    behaviourQuery = jasmine.createSpy('getWithQuery').and.callFake(query);
    // Empty until the run is known, as in the app: the jobs cache fills after loadJobs().
    jobs$ = new BehaviorSubject<Job[]>([]);

    await TestBed.configureTestingModule({
      imports: [RunComposerComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: JobService,
          useValue: { entities$: jobs$.asObservable(), loading$: of(false), getWithQuery: () => {} }
        },
        {
          provide: BehaviorService,
          useValue: {
            entities$: behaviours$.asObservable(),
            getWithQuery: behaviourQuery,
            pageMeta$: pageMeta$.asObservable(),
            add: () => of({})
          }
        },
        {
          provide: QueueService,
          useValue: { getByKey: () => of({ id: 9, name: 'Run', start_at: '2030-01-01T10:00:00' }) }
        },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: params$.pipe(map((run) => ({ get: (k: string) => (k === 'runId' ? run : '1') }))) }
        },
        { provide: DecisionApiService, useValue: { decisionUrl: () => '', fetchDecision: () => of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    jobs$.next(JOBS);
    fixture.detectChanges();
  }

  it("loads a short run's behaviours in one call, filtered by run", async () => {
    await create();
    expect(behaviourQuery).toHaveBeenCalledOnceWith({ ['filter[queue]']: '9', per_page: '500', page: '1' });
  });

  // On ex63, 167 of 31,790 runs hold more than 500 behaviours (review on #63).
  describe('a run with more behaviours than one page', () => {
    const page = (n: number) => Array.from({ length: n }, (_, i) => behaviour(1000 + i, 'url'));

    it('keeps reading pages until one comes back short', async () => {
      await create(() => (behaviourQuery.calls.count() === 1 ? of(page(500)) : of(page(284))));

      expect(behaviourQuery.calls.allArgs()).toEqual([
        [{ ['filter[queue]']: '9', per_page: '500', page: '1' }],
        [{ ['filter[queue]']: '9', per_page: '500', page: '2' }]
      ]);
      expect(component.missing(JOBS[2])).toEqual(['selector']);
    });

    it("follows the response's last_page rather than the page length", async () => {
      // A page one row short (e.g. a delete in flight) must not end the read early.
      await create(() => {
        const n = behaviourQuery.calls.count();
        pageMeta$.next({ current_page: n, last_page: 2 });
        return of(page(n === 1 ? 499 : 500));
      });

      expect(behaviourQuery.calls.count()).toBe(2);
      expect(component.missing(JOBS[2])).toEqual(['selector']);
    });

    it('shows no flags until the last page is in', async () => {
      const second = new Subject<Behavior[]>();
      await create(() => (behaviourQuery.calls.count() === 1 ? of(page(500)) : second));

      expect(component.missing(JOBS[2])).toEqual([]);

      second.next(page(3));
      second.complete();
      expect(component.missing(JOBS[2])).toEqual(['selector']);
    });

    it('shows no flags when a later page fails', async () => {
      await create(() => (behaviourQuery.calls.count() === 1 ? of(page(500)) : throwError(() => new Error('502'))));

      expect(component.missing(JOBS[2])).toEqual([]);
      expect(component.incompleteJobs).toBe(0);
    });
  });

  it('flags required settings without an ACTIVE behaviour, per job', async () => {
    await create();

    expect(component.missing(JOBS[0])).toEqual([]);
    expect(component.missing(JOBS[1])).toEqual(['seconds']); // present but inactive
    expect(component.missing(JOBS[2])).toEqual(['selector']);
    expect(component.missing(JOBS[3])).toEqual([]); // unknown type: never flagged
    expect(component.incompleteJobs).toBe(2);

    const row = fixture.nativeElement.querySelector('[data-testid="job-missing-3"]');
    expect(row.textContent).toContain('selector');
    expect(fixture.nativeElement.querySelector('[data-testid="run-incomplete"]')).not.toBeNull();
  });

  it('recomputes as behaviours change — e.g. from the behaviours modal', async () => {
    await create();

    behaviours$.next([...behaviours$.value, behaviour(2, 'seconds'), behaviour(3, 'selector')]);
    fixture.detectChanges();

    expect(component.incompleteJobs).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="run-incomplete"]')).toBeNull();
  });

  it('says nothing when the behaviours could not be loaded, rather than flagging everything', async () => {
    await create(() => throwError(() => new Error('400 unknown filter')));

    expect(component.missing(JOBS[2])).toEqual([]);
    expect(component.incompleteJobs).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="run-incomplete"]')).toBeNull();
  });

  it('hides the flags while a different run loads, rather than judging it by a stale cache', async () => {
    const next = new Subject<Behavior[]>();
    await create(() => (behaviourQuery.calls.count() === 1 ? of([]) : next));
    expect(component.behavioursKnown).toBeTrue();

    params$.next('10');
    jobs$.next([job({ id: 7, queue_id: 10, order: 1, type: 'visitjob' })]);
    fixture.detectChanges();
    expect(component.missing(component.jobs[0])).toEqual([]);

    next.next([]);
    next.complete();
    expect(component.missing(component.jobs[0])).toEqual(['url']);
  });
});
