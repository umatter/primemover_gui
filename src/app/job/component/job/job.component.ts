import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { currentQueueResetRequested } from '../../../queue/store/queue.actions';
import { Queue } from '../../../queue/model/queue';
import {
  selectCurrentQueue,
  selectIsLoading,
  selectJobsListData,
  selectJobsPagination
} from '../../store/job.selectors';
import { jobPageRequested } from '../../store/job.actions';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html'
})
export class JobComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  currentQueue$: Observable<Queue | null>;
  isLoading$: Observable<boolean>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.data$ = this.store.pipe(distinctUntilChanged(), select(selectJobsListData));
    this.currentQueue$ = this.store.pipe(select(selectCurrentQueue));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(jobPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectJobsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  resetQueueFilter(): void {
    this.store.dispatch(currentQueueResetRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
