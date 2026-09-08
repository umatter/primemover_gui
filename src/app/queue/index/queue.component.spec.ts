import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { QueueComponent } from './queue.component';
import { QueueService } from '@app/entity/service';
import { QueueApiService } from '@app/queue/service/queue-api.service';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { Queue } from '@app/queue/model/queue';
import { SharedActions } from '@shared/store/shared.actions';
import { selectCurrentQueue } from '@shared/store/shared.selectors';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { STATUS_FILTER_BAD_PARAM, STATUS_FILTER_STATUS_PARAM } from '@shared/model/status-filter';
import { SortBy } from '@shared/model/sort';
import { LinkSortableComponent } from '@shared/link/link-sortable/link-sortable.component';

/**
 * `/queues` — the screen a researcher scans to find the runs that went wrong.
 *
 * Two things are being pinned here, and both are about not re-deriving the status contract
 * in the browser:
 *
 * 1. **"Needs attention" asks `filter[bad]=1`.** The GUI must not send its own union of
 *    `failure`/`failed`/`error`/`warning`/`warn`; that list is a second copy of the alias
 *    table and would already be missing rows — 256 of the live `jobs` rows are spelled
 *    `failed`, 170 `failure`.
 * 2. **The status column sorts by `severity`.** Sorting the raw string puts those two
 *    spellings in different blocks and neither next to `warning`.
 *
 * The stub this replaces used `declarations: [QueueComponent]` on a standalone component
 * and had never executed.
 */
describe('QueueComponent (/queues — finding the bad runs)', () => {
  let fixture: ComponentFixture<QueueComponent>;
  let component: QueueComponent;
  let element: HTMLElement;
  let store: MockStore;
  let getWithQuery: jasmine.Spy;
  let clearCache: jasmine.Spy;
  let cancel: jasmine.Spy;

  const run = (over: Partial<Queue>): Queue =>
    ({
      id: 845,
      name: 'Morning session',
      crawler_id: 3,
      status_code: 'success',
      processed: 1,
      processing: 0,
      reviewed: 0,
      ...over
    }) as Queue;

  const build = (runs: Queue[] = [run({})]): void => {
    getWithQuery = jasmine.createSpy('getWithQuery');
    clearCache = jasmine.createSpy('clearCache');
    cancel = jasmine.createSpy('cancel');

    TestBed.configureTestingModule({
      imports: [QueueComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideMockStore({
          initialState: {},
          selectors: [
            { selector: selectQueryFilter, value: [] },
            { selector: selectCurrentQueue, value: null }
          ]
        }),
        { provide: ExperimentApiService, useValue: {} },
        {
          provide: QueueService,
          useValue: {
            entities$: of(runs),
            loading$: of(false),
            pageMeta$: of({ current_page: 1, per_page: 15, total: runs.length }),
            getWithQuery,
            clearCache,
            cancel,
            delete: () => of(true)
          }
        },
        {
          provide: QueueApiService,
          useValue: {
            // Whatever the shared filter/sort machinery contributes; the chip's parameters
            // are merged on top of exactly this.
            getParams: () => ({ page: 1, sort: '-id', 'filter[recent]': 30 }),
            getPaginateArgs: () => ({ id: 'queues', itemsPerPage: 15, currentPage: 1, totalItems: runs.length })
          }
        }
      ]
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      common: { yes: 'Yes', no: 'No' },
      status: { processed: 'Completed', processing: 'Running', review: 'Review' }
    });
    translate.use('en');

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(QueueComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  const lastQuery = (): Record<string, unknown> => getWithQuery.calls.mostRecent().args[0] as Record<string, unknown>;

  const clickChip = (key: string): void => {
    element.querySelector<HTMLButtonElement>(`[data-status-filter="${key}"]`)!.click();
    fixture.detectChanges();
  };

  describe('the status chips', () => {
    it('starts on "All" and sends no status parameter', () => {
      build();

      expect(component.statusFilter).toBe('all');
      expect(lastQuery()[STATUS_FILTER_BAD_PARAM]).toBeUndefined();
      expect(lastQuery()[STATUS_FILTER_STATUS_PARAM]).toBeUndefined();
      // and leaves the shared filter/sort parameters untouched
      expect(lastQuery()['sort']).toBe('-id');
      expect(lastQuery()['filter[recent]']).toBe(30);
    });

    it('sends filter[bad]=1 for "Needs attention" — not a hand-built alias list', () => {
      build();
      clickChip('bad');

      const query = lastQuery();
      expect(query[STATUS_FILTER_BAD_PARAM]).toBe('1');
      expect(query[STATUS_FILTER_STATUS_PARAM]).toBeUndefined();
      expect(JSON.stringify(query)).not.toContain('failed');
      expect(JSON.stringify(query)).not.toContain('warn');
    });

    it('sends the canonical code for a single-status chip', () => {
      build();
      clickChip('failure');

      expect(lastQuery()[STATUS_FILTER_STATUS_PARAM]).toBe('failure');
      expect(lastQuery()[STATUS_FILTER_BAD_PARAM]).toBeUndefined();
    });

    it('drops back to no status parameter on "All"', () => {
      build();
      clickChip('bad');
      clickChip('all');

      expect(lastQuery()[STATUS_FILTER_BAD_PARAM]).toBeUndefined();
      expect(lastQuery()[STATUS_FILTER_STATUS_PARAM]).toBeUndefined();
    });

    it('goes back to page 1: page 3 of "all" is not page 3 of "the failed ones"', () => {
      build();
      const dispatch = spyOn(store, 'dispatch').and.callThrough();
      clickChip('failure');

      expect(dispatch).toHaveBeenCalledWith(SharedActions.requestPage({ page: 1 }));
    });

    it('clears the cache first, so the previous, wider result does not linger', () => {
      build();
      clearCache.calls.reset();
      clickChip('failure');

      expect(clearCache).toHaveBeenCalled();
      expect(clearCache.calls.count()).toBe(1);
    });

    it('does not multiply requests when the chips are clicked repeatedly', () => {
      // `getData()` adds a fresh queryFilter$ subscription on every call, so driving the
      // chips through it would fire N requests on the next unrelated filter change.
      build();
      const before = getWithQuery.calls.count();
      clickChip('failure');
      clickChip('warning');
      clickChip('bad');

      expect(getWithQuery.calls.count()).toBe(before + 3);
    });

    /**
     * `clearCache()` is not enough on its own. It fires immediately, long before any
     * response; three chips clicked faster than the API answers leave three requests live,
     * and ngrx/data MERGES all three results into the emptied collection — so the chip
     * reads "Needs attention" over a table that also holds the successes the first query
     * returned. Each query therefore carries a correlation id and cancels its predecessor,
     * which `EntityEffects.persist$` races against the response.
     */
    it('cancels the superseded query, so a slower earlier response cannot merge into the list', () => {
      build();
      clickChip('failure');
      const superseded = (getWithQuery.calls.mostRecent().args[1] as { correlationId: unknown }).correlationId;

      clickChip('warning');

      expect(superseded).toBeTruthy();
      expect(cancel).toHaveBeenCalledWith(superseded, jasmine.any(String));
      expect((getWithQuery.calls.mostRecent().args[1] as { correlationId: unknown }).correlationId).not.toBe(
        superseded
      );
    });
  });

  describe('the job rollup column', () => {
    it('replaces the three Yes/No columns with one bar', () => {
      build([run({ jobs_count: 113, jobs_succeeded_count: 69, jobs_failed_count: 22 })]);

      expect(element.querySelector('[data-rollup-bar]')).not.toBeNull();
      expect(element.querySelector('[data-segment="failed"]')).not.toBeNull();
    });

    it('keeps processed / processing / reviewed reachable in the tooltip', () => {
      build([run({ processed: 1, processing: 0, reviewed: 0, jobs_count: 2, jobs_succeeded_count: 2 })]);
      const bar = element.querySelector<HTMLElement>('[data-rollup-bar]')!;

      expect(bar.getAttribute('title')).toContain('Completed: Yes');
      expect(bar.getAttribute('title')).toContain('Running: No');
      expect(bar.getAttribute('title')).toContain('Review: No');
    });

    it('renders those flags as words, never as a bare boolean', () => {
      build([run({ processed: 1, processing: 0 })]);

      expect(component.legacyFlags(run({ processed: 1, processing: 0, reviewed: 0 }))).toBe(
        'Completed: Yes · Running: No · Review: No'
      );
    });
  });

  it('sorts the status column by normalised severity, not by the raw string', () => {
    build();
    const sorts = fixture.debugElement
      .queryAll(By.directive(LinkSortableComponent))
      .map((node) => (node.componentInstance as LinkSortableComponent).sortBy);

    expect(sorts).toContain(SortBy.SEVERITY);
    expect(sorts).not.toContain(SortBy.STATUSCODE);
    // the three legacy sorts went with their columns
    expect(sorts).not.toContain(SortBy.PROCESSED);
    expect(sorts).not.toContain(SortBy.PROCESSING);
    expect(sorts).not.toContain(SortBy.REVIEWED);
  });
});
