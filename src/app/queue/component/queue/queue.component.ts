import { Component, OnDestroy, OnInit } from '@angular/core';
import { fadeIn } from '../../../shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { selectExperimentsListData } from '../../../experiment/store/experiment.selectors';
import { selectIsLoading, selectQueuesListData, selectQueuesPagination } from '../../store/queue.selectors';
import { queuePageRequested, queueRequested } from '../../store/queue.actions';
import { Crawler } from '../../../crawler/model/crawler';
import { selectCurrentCrawler } from '../../../crawler/store/crawler.selectors';
import { currentCrawlerResetRequested } from '../../../crawler/store/crawler.actions';
import { Queue } from '../../model/queue';
import { Router } from '@angular/router';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  animations: [fadeIn]
})
export class QueueComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  experiments$: Observable<any>;
  currentCrawler$: Observable<Crawler | null>;
  isLoading$: Observable<boolean>;

  constructor(private store: Store, public router: Router) {}

  ngOnInit() {
    this.data$ = this.store.pipe(select(selectQueuesListData));
    this.experiments$ = this.store.pipe(select(selectExperimentsListData));
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(queuePageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectQueuesPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectQueue(queue: Queue): void {
    this.store.dispatch(queueRequested(queue));
    this.router.navigate(['jobs']).then();
  }

  resetCrawlerFilter(): void {
    this.store.dispatch(currentCrawlerResetRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }


}
