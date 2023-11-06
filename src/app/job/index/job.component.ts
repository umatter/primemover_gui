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
    HeroiconDownloadArchiveComponent
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

  private subscriptions = new Subscription();

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
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
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
    this.subscriptions.unsubscribe();
  }

  selectJob(item: Job) {
    this.store.dispatch(SharedActions.jobSelection({ job: item }));
    this.router.navigate(['/jobs', 'behaviors', item.id]).then();
  }
}
