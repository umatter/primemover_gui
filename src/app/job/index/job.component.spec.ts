import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { JobComponent } from './job.component';
import { JobService } from '@app/entity/service';
import { JobApiService } from '@app/job/service/job-api.service';
import { DecisionApiService } from '@app/job/service/decision-api.service';
import { Job } from '@app/job/model/Job';
import { selectCurrentJob } from '@shared/store/shared.selectors';
import { selectDownloadSuccess, selectError, selectIsLoading, selectQueryFilter } from '@shared/store/shared.reducer';
import { SharedActions } from '@shared/store/shared.actions';
import { SortBy } from '@shared/model/sort';
import { LinkSortableComponent } from '@shared/link/link-sortable/link-sortable.component';

/**
 * The `/jobs` list is where a researcher scans many jobs at once, so it is the one place
 * a silent treatment loss would be scanned straight past. The decision column exists to
 * make that impossible: `status_code` says the job ran, and only the verdict says whether
 * the treatment it was configured for actually applied.
 *
 * The stub this replaces used `declarations: [JobComponent]` on a standalone component
 * and had never executed.
 */
describe('JobComponent (/jobs — the decision column)', () => {
  let fixture: ComponentFixture<JobComponent>;

  const job = (over: Partial<Job>): Job =>
    ({
      id: 1,
      name: 'Pick a video',
      type: 'lambdasingleselectjob',
      status_code: 'success',
      queue_id: 9,
      reports_with_path_count: 0,
      ...over
    }) as Job;

  const render = (jobs: Job[]): HTMLElement => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [JobComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectError, value: null },
            { selector: selectDownloadSuccess, value: null },
            { selector: selectQueryFilter, value: [] },
            { selector: selectCurrentJob, value: null },
            { selector: selectIsLoading, value: false }
          ]
        }),
        {
          provide: JobService,
          useValue: {
            entities$: of(jobs),
            loading$: of(false),
            pageMeta$: of({ current_page: 1, per_page: 15, total: jobs.length }),
            getWithQuery: () => {},
            clearCache: () => {},
            cancel: () => {}
          }
        },
        {
          provide: JobApiService,
          useValue: {
            getParams: () => ({}),
            getPaginateArgs: () => ({ id: 'jobs', itemsPerPage: 15, currentPage: 1, totalItems: jobs.length })
          }
        },
        {
          provide: DecisionApiService,
          useValue: { decisionUrl: (id: number) => `/api/v1/jobs/${id}/decision`, fetchDecision: () => of({}) }
        }
      ]
    });
    const f = TestBed.createComponent(JobComponent);
    f.detectChanges();
    return f.nativeElement as HTMLElement;
  };

  it('flags a lost treatment on a row whose status says "success"', () => {
    const el = render([
      job({ id: 34226, status_code: 'success', decision_treatment_lost: true, decision_degraded: true })
    ]);
    const badge = el.querySelector('[data-decision]') as HTMLElement;

    expect(badge.getAttribute('data-decision')).toBe('lost');
    expect(badge.className).toContain('text-danger');
    // The status pill is untouched: the run worked, the science did not.
    expect(el.textContent).toContain('status.success');
  });

  it('shows a grey "no verdict" mark on a lambda job the API says nothing about', () => {
    const el = render([job({ id: 2 })]);
    const badge = el.querySelector('[data-decision]') as HTMLElement;

    expect(badge.getAttribute('data-decision')).toBe('unknown');
    expect(badge.className).not.toContain('text-success');
  });

  it('shows no verdict marking at all on a job type that never calls the decision function', () => {
    const el = render([job({ id: 3, type: 'visitjob' })]);

    expect(el.querySelector('[data-decision]')).toBeNull();
    expect(el.textContent).not.toContain('decision.report.title');
  });

  it('offers the report expander on a lambda job and not on a plain one', () => {
    const el = render([job({ id: 4 }), job({ id: 5, type: 'waitjob' })]);

    // Every row also carries a diagnostics expander now (timestamps, message, captcha
    // flag), so count the decision ones rather than every <details> on the screen.
    const decisionExpanders = Array.from(el.querySelectorAll('details') as NodeListOf<HTMLElement>).filter((node) =>
      (node.textContent ?? '').includes('decision.report.title')
    );

    expect(decisionExpanders.length).toBe(1);
    expect(el.querySelectorAll('[data-testid="job-diagnostics"]').length)
      .withContext('diagnostics are offered on every job, decision verdict or not')
      .toBe(2);
  });
});

/**
 * The same "find the bad ones" contract on `/jobs`.
 *
 * Jobs are where the legacy spellings are thickest — the live table holds 256 rows spelled
 * `failed` next to 170 spelled `failure` — so a "Needs attention" view assembled in the
 * browser would under-report failures by more than half. It has to be the API's predicate.
 */
describe('JobComponent (/jobs — the status chips)', () => {
  let fixture: ComponentFixture<JobComponent>;
  let component: JobComponent;
  let element: HTMLElement;
  let store: MockStore;
  let getWithQuery: jasmine.Spy;
  let clearCache: jasmine.Spy;
  let cancel: jasmine.Spy;

  beforeEach(() => {
    TestBed.resetTestingModule();
    getWithQuery = jasmine.createSpy('getWithQuery');
    clearCache = jasmine.createSpy('clearCache');
    cancel = jasmine.createSpy('cancel');

    TestBed.configureTestingModule({
      imports: [JobComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectError, value: null },
            { selector: selectDownloadSuccess, value: null },
            { selector: selectQueryFilter, value: [] },
            { selector: selectCurrentJob, value: null },
            { selector: selectIsLoading, value: false }
          ]
        }),
        {
          provide: JobService,
          useValue: {
            entities$: of([]),
            loading$: of(false),
            pageMeta$: of({ current_page: 1, per_page: 15, total: 0 }),
            getWithQuery,
            clearCache,
            cancel,
            delete: () => of(true)
          }
        },
        {
          provide: JobApiService,
          useValue: {
            getParams: () => ({ page: 1, sort: '-id' }),
            getPaginateArgs: () => ({ id: 'jobs', itemsPerPage: 15, currentPage: 1, totalItems: 0 })
          }
        },
        {
          provide: DecisionApiService,
          useValue: { decisionUrl: (id: number) => `/api/v1/jobs/${id}/decision`, fetchDecision: () => of({}) }
        }
      ]
    });

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(JobComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  const lastQuery = (): Record<string, unknown> => getWithQuery.calls.mostRecent().args[0] as Record<string, unknown>;

  const clickChip = (key: string): void => {
    element.querySelector<HTMLButtonElement>(`[data-status-filter="${key}"]`)!.click();
    fixture.detectChanges();
  };

  it('offers the seven chips and starts on "All"', () => {
    expect(element.querySelectorAll('[data-status-filter]').length).toBe(7);
    expect(component.statusFilter).toBe('all');
    expect(lastQuery()['filter[bad]']).toBeUndefined();
  });

  it('sends filter[bad]=1 for "Needs attention", never a client-side alias union', () => {
    clickChip('bad');

    expect(lastQuery()['filter[bad]']).toBe('1');
    expect(lastQuery()['filter[status_code]']).toBeUndefined();
    expect(JSON.stringify(lastQuery())).not.toContain('failed');
  });

  it('sends the canonical code for a single-status chip and keeps the shared parameters', () => {
    clickChip('warning');

    expect(lastQuery()['filter[status_code]']).toBe('warning');
    expect(lastQuery()['sort']).toBe('-id');
  });

  it('resets to page 1 and clears the cache on every chip change', () => {
    const dispatch = spyOn(store, 'dispatch').and.callThrough();
    clearCache.calls.reset();
    clickChip('failure');

    expect(dispatch).toHaveBeenCalledWith(SharedActions.requestPage({ page: 1 }));
    expect(clearCache.calls.count()).toBe(1);
  });

  /**
   * Against ~31,600 job rows this is also six full list queries per traversal, but the
   * reason it is a correctness bug rather than a slow one is that ngrx/data merges: the
   * chip claims one narrow filter while the table shows the union of everything that was
   * still in flight. Each query cancels its predecessor so the loser's result is never
   * dispatched.
   */
  it('cancels the superseded query so a slower earlier response cannot merge into the list', () => {
    clickChip('failure');
    const superseded = (getWithQuery.calls.mostRecent().args[1] as { correlationId: unknown }).correlationId;

    clickChip('bad');

    expect(superseded).toBeTruthy();
    expect(cancel).toHaveBeenCalledWith(superseded, jasmine.any(String));
  });

  it('sorts the status column by severity so "failed" and "failure" stay together', () => {
    const sorts = fixture.debugElement
      .queryAll(By.directive(LinkSortableComponent))
      .map((node) => (node.componentInstance as LinkSortableComponent).sortBy);

    expect(sorts).toContain(SortBy.SEVERITY);
    expect(sorts).not.toContain(SortBy.STATUSCODE);
  });
});
