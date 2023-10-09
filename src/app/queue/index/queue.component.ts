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
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusComponent } from '@app/queue/status/status.component';

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
    StatusComponent
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

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    private experimentService: ExperimentApiService,
    private entityService: QueueService,
    private apiService: QueueApiService
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
