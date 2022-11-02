import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { currentExperimentResetRequested } from '../../../experiment/store/experiment.actions';
import { selectCurrentExperiment, selectExperimentsListData } from '../../../experiment/store/experiment.selectors';
import { crawlerPageRequested, crawlerRequested } from '../../store/crawler.actions';
import { fadeIn } from '../../../shared/animation/trigger';
import { selectCrawlersListData, selectCrawlersPagination, selectIsLoading } from '../../store/crawler.selectors';
import { Crawler } from '../../model/crawler';
import { Experiment } from '../../../experiment/model/experiment';

@Component({
  selector: 'app-crawler',
  templateUrl: './crawler.component.html',
  animations: [fadeIn]
})
export class CrawlerComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  experiments$: Observable<any>;
  currentExperiment$: Observable<Experiment | null>;
  isLoading$: Observable<boolean>;
  experiment: any;

  constructor(private store: Store, public router: Router) {}

  ngOnInit() {
    this.data$ = this.store.pipe(select(selectCrawlersListData));
    this.experiments$ = this.store.pipe(select(selectExperimentsListData));
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();

  }

  getData(page: number = 1): void {
    this.store.dispatch(crawlerPageRequested({ page: page }));
  }

  selectCrawler(crawler: Crawler): void {
    this.store.dispatch(crawlerRequested(crawler));
    this.router.navigate(['queues']).then();
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectCrawlersPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  resetExperimentFilter(): void {
    this.store.dispatch(currentExperimentResetRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
