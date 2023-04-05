import { Component, OnDestroy } from '@angular/core';
import { fadeIn } from '@shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { Queue } from '../model/queue';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { QueueService } from '@app/entity/service';
import { queueSelection, requestPage } from '@shared/store/shared.actions';
import { QueueApiService } from '@app/queue/service/queue-api.service';
import { selectCurrentQueue, selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { Meta } from '@shared/pagination/model';
import { PaginationType } from '@shared/pagination/type';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  animations: [fadeIn]
})
export class QueueComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
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
    this.store.dispatch(requestPage({ page }));

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
        this.paginationConfig = {
          id: PaginationType.QUEUE,
          itemsPerPage: meta?.per_page,
          currentPage: meta?.current_page,
          totalItems: meta?.total
        };
      })
    );
  }

  selectQueue(queue: Queue): void {
    this.store.dispatch(queueSelection({ queue }));
  }

  deleteRequested(queue: Queue): void {
    this.entityToDelete = queue;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.entityService.delete(this.entityToDelete.id);
      this.store.dispatch(queueSelection({ queue: null }));
    }
    this.entityToDelete = null;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
