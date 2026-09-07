import { Component, OnDestroy } from '@angular/core';
import { fadeIn } from '@shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { NgxPaginationModule, PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { Queue } from '../model/queue';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { QueueService } from '@app/entity/service';
import { QueueApiService } from '@app/queue/service/queue-api.service';
import { QueryFilterType, selectCurrentQueue } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { Meta } from '@shared/pagination/model';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { LinkSortableComponent } from '@shared/link/link-sortable/link-sortable.component';
import { QueueModule } from '@app/queue/queue.module';
import { HeroiconClipboardDocumentComponent } from '@shared/icon/heroicon-clipboard-document/heroicon-clipboard-document.component';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { HeroiconTrashComponent } from '@shared/icon/heroicon-trash/heroicon-trash.component';
import { ControlsComponent } from '@shared/pagination/controls/controls.component';
import { ConfirmationModalComponent } from '@shared/dialog/confirmation-modal/confirmation-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusComponent } from '@app/queue/status/status.component';
import { SortBy } from '@shared/model/sort';
import { StatusFilterComponent } from '@shared/filter/status-filter/status-filter.component';
import { StatusFilterKey, statusFilterParams } from '@shared/model/status-filter';
import { JobRollupBarComponent } from '@app/queue/rollup-bar/job-rollup-bar.component';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  animations: [fadeIn],
  imports: [
    LinkSortableComponent,
    QueueModule,
    HeroiconClipboardDocumentComponent,
    LoadingSpinnerComponent,
    LinkSortableComponent,
    HeroiconTrashComponent,
    LinkSortableComponent,
    ControlsComponent,
    LinkSortableComponent,
    LinkSortableComponent,
    ConfirmationModalComponent,
    LinkSortableComponent,
    LinkSortableComponent,
    TranslateModule,
    AsyncPipe,
    NgIf,
    RouterLink,
    NgClass,
    NgForOf,
    NgxPaginationModule,
    StatusComponent,
    StatusFilterComponent,
    JobRollupBarComponent
  ],
  standalone: true
})
export class QueueComponent implements OnDestroy {
  isLoading$ = this.entityService.loading$;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Queue[] | any>;
  entityToDelete: Queue | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentQueue$: Observable<Queue>;
  pageMeta$: Observable<Meta>;
  /** The active status chip. Server-side; see {@link statusFilterParams}. */
  statusFilter: StatusFilterKey = 'all';
  protected readonly SortBy = SortBy;
  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    private experimentService: ExperimentApiService,
    private entityService: QueueService,
    private apiService: QueueApiService,
    private translate: TranslateService
  ) {
    this.isLoading$ = entityService.loading$;
    this.entities$ = entityService.entities$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentQueue$ = this.store.pipe(select(selectCurrentQueue));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(SharedActions.requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.queryParams());
      })
    );
  }

  /**
   * The full query: the shared filters and sort the API service builds, plus the status
   * chip's own parameters.
   *
   * The chip is not routed through the shared `queryFilter` store slice on purpose. That
   * slice is global — one selection would follow the user from `/queues` to `/jobs` — and
   * it is rendered as removable badges in the app header, where "Status / 1" would be a
   * puzzle. Screen-local state, one merge point.
   */
  queryParams(): { [name: string]: any } {
    return { ...this.apiService.getParams(), ...statusFilterParams(this.statusFilter) };
  }

  /**
   * Re-query on a chip click, resetting to page 1.
   *
   * Deliberately not via `getData()`: that method adds a fresh `queryFilter$` subscription
   * every time it is called, so driving it from a control the user clicks repeatedly would
   * multiply the requests fired by the next unrelated filter change. Page 1 matters too —
   * page 3 of "all runs" is not page 3 of "the failed ones".
   */
  onStatusFilter(key: StatusFilterKey): void {
    this.statusFilter = key;
    this.store.dispatch(SharedActions.requestPage({ page: 1 }));
    this.entityService.clearCache();
    this.entityService.getWithQuery(this.queryParams());
  }

  /**
   * The three legacy booleans this row used to spend three columns on, as one sentence.
   *
   * They are bookkeeping flags the runner sets while working a queue, not a status: a run
   * stopped mid-flight sits at `processing=1, processed=0` forever. Kept because that is
   * still the only way to see a queue the runner picked up and never finished — but on
   * hover, not at the same weight as the run's actual outcome.
   */
  legacyFlags(queue: Queue): string {
    const yesNo = (value: number | boolean): string => this.translate.instant(value ? 'common.yes' : 'common.no');
    return [
      `${this.translate.instant('status.processed')}: ${yesNo(queue.processed)}`,
      `${this.translate.instant('status.processing')}: ${yesNo(queue.processing)}`,
      `${this.translate.instant('status.review')}: ${yesNo(queue.reviewed)}`
    ].join(' · ');
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  selectQueue(queue: Queue): void {
    this.store.dispatch(SharedActions.queueSelection({ queue }));
  }

  deleteRequested(queue: Queue): void {
    this.entityToDelete = queue;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.subscriptions.add(
        this.entityService
          .delete(this.entityToDelete.id)
          .pipe()
          .subscribe(() => {
            this.store.dispatch(SharedActions.queueSelection({ queue: null }));
            this.store.dispatch(SharedActions.resetQueryFilterRequested({ filterName: QueryFilterType.Queue }));
            this.entityToDelete = null;
          })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
