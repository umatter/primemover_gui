import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { NgxPaginationModule, PaginatePipeArgs } from 'ngx-pagination';
import { Store } from '@ngrx/store';
import { JobService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';
import { QueryFilterType, selectCurrentJob } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { JobApiService } from '@app/job/service/job-api.service';
import { Router, RouterLink } from '@angular/router';
import { Meta } from '@shared/pagination/model';
import { SharedActions } from '@shared/store/shared.actions';
import { selectDownloadSuccess, selectError, selectIsLoading, selectQueryFilter } from '@shared/store/shared.reducer';
import { HeroiconTrashComponent } from '@shared/icon/heroicon-trash/heroicon-trash.component';
import { LinkSortableComponent } from '@shared/link/link-sortable/link-sortable.component';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { HeroiconClipboardDocumentComponent } from '@shared/icon/heroicon-clipboard-document/heroicon-clipboard-document.component';
import { ConfirmationModalComponent } from '@shared/dialog/confirmation-modal/confirmation-modal.component';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { ControlsComponent } from '@shared/pagination/controls/controls.component';
import { QueueModule } from '@app/queue/queue.module';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HeroiconDownloadComponent } from '@shared/icon/heroicon-download/heroicon-download.component';
import { StatusComponent } from '@app/queue/status/status.component';
import { HeroiconDownloadArchiveComponent } from '@shared/icon/heroicon-download-archive/heroicon-download-archive.component';
import { SortBy } from '@shared/model/sort';
import { DecisionBadgeComponent } from '@app/job/decision/decision-badge.component';
import { JobDiagnosticsComponent } from '@app/job/diagnostics/job-diagnostics.component';
import { DecisionReportComponent } from '@app/job/decision/decision-report.component';
import { hasDecisionReport, isDecisionJobType } from '@app/job/model/decision';
import { StatusFilterComponent } from '@shared/filter/status-filter/status-filter.component';
import { StatusFilterKey, statusFilterParams } from '@shared/model/status-filter';
import { SupersedingQuery } from '@shared/model/superseding-query';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  imports: [
    HeroiconTrashComponent,
    NotificationComponent,
    HeroiconClipboardDocumentComponent,
    ConfirmationModalComponent,
    LoadingSpinnerComponent,
    LinkSortableComponent,
    ControlsComponent,
    QueueModule,
    NgIf,
    RouterLink,
    AsyncPipe,
    TranslateModule,
    NgxPaginationModule,
    NgForOf,
    NgClass,
    HeroiconDownloadComponent,
    StatusComponent,
    HeroiconDownloadArchiveComponent,
    DecisionBadgeComponent,
    DecisionReportComponent,
    JobDiagnosticsComponent,
    StatusFilterComponent
  ],
  standalone: true
})
export class JobComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Job[]>;
  entityToDelete: Job | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentJob$: Observable<Job>;
  pageMeta$: Observable<Meta>;
  error$: Observable<any>;
  downloadSuccess$: Observable<any>;
  /** The active status chip. Server-side; see {@link statusFilterParams}. */
  statusFilter: StatusFilterKey = 'all';
  protected readonly SortBy = SortBy;
  private subscriptions = new Subscription();

  /**
   * Every list query this screen issues, newest cancelling the one before it. See
   * {@link SupersedingQuery}: `clearCache()` handles the sequential case only, and chips
   * clicked or arrowed through faster than the API answers are not sequential.
   */
  private readonly listQuery = new SupersedingQuery<Job>(this.entityService, 'jobs');

  constructor(
    private store: Store,
    private entityService: JobService,
    private apiService: JobApiService,
    private router: Router
  ) {
    this.pageMeta$ = this.entityService.pageMeta$;
    this.entities$ = this.entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.error$ = this.store.select(selectError);
    this.downloadSuccess$ = this.store.select(selectDownloadSuccess);

    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentJob$ = this.store.select(selectCurrentJob);
    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(SharedActions.requestPage({ page }));
    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.listQuery.run(this.queryParams());
      })
    );
  }

  /**
   * The shared filters and sort, plus the status chip's own parameters.
   *
   * Screen-local rather than in the shared `queryFilter` store slice: that slice is global
   * and is rendered as removable badges in the app header, so a status chosen here would
   * follow the user to `/queues` and show up as a badge nobody asked for.
   */
  queryParams(): { [name: string]: any } {
    return { ...this.apiService.getParams(), ...statusFilterParams(this.statusFilter) };
  }

  /**
   * Re-query on a chip click, back to page 1.
   *
   * Not via `getData()`, which adds a new `queryFilter$` subscription on every call — a
   * control the user clicks repeatedly would multiply the requests the next filter change
   * fires.
   */
  onStatusFilter(key: StatusFilterKey): void {
    this.statusFilter = key;
    this.store.dispatch(SharedActions.requestPage({ page: 1 }));
    this.entityService.clearCache();
    this.listQuery.run(this.queryParams());
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  deleteRequested(job: Job): void {
    this.entityToDelete = job;
  }

  downloadReport(job: Job): void {
    this.isLoading$ = this.store.select(selectIsLoading);
    this.store.dispatch(SharedActions.downloadFile({ job: job }));
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.subscriptions.add(
        this.entityService
          .delete(this.entityToDelete.id)
          .pipe()
          .subscribe(() => {
            this.store.dispatch(SharedActions.jobSelection({ job: null }));
            this.store.dispatch(SharedActions.resetQueryFilterRequested({ filterName: QueryFilterType.Job }));
            this.entityToDelete = null;
          })
      );
    }
  }

  ngOnDestroy() {
    this.listQuery.cancelInFlight();
    this.subscriptions.unsubscribe();
  }

  /**
   * Whether to offer the decision-report expander on this row.
   *
   * Shown for every job that carries a verdict, and for every job type that calls the
   * decision function even when it carries none — because "nothing was recorded" is the
   * answer a researcher needs to see on a lambda job, and because the archived payload in
   * MinIO may still hold the verdict the columns do not.
   */
  showsDecision(job: Job): boolean {
    return hasDecisionReport(job) || isDecisionJobType(job.type);
  }

  selectJob(item: Job) {
    this.store.dispatch(SharedActions.jobSelection({ job: item }));
    this.router.navigate(['/jobs', 'behaviors', item.id]).then();
  }
}
