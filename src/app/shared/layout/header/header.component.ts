import { Component, OnInit } from '@angular/core';
import { combineLatest, first, map, mergeAll, Observable, withLatestFrom } from 'rxjs';
import { Experiment } from '../../../crawler/model/experiment';
import { select, Store } from '@ngrx/store';
import { selectCurrentExperiment } from '../../../experiment/store/experiment.selectors';
import { currentExperimentResetRequested } from '../../../experiment/store/experiment.actions';
import { currentCrawlerResetRequested } from '../../../crawler/store/crawler.actions';
import { Crawler } from '../../../crawler/model/crawler';
import { selectCurrentCrawler } from '../../../crawler/store/crawler.selectors';
import { currentQueueResetRequested } from '../../../queue/store/queue.actions';
import { Queue } from '../../../queue/model/queue';
import { selectCurrentQueue } from '../../../job/store/job.selectors';
import { fadeIn } from '../../animation/trigger';
import { clearQueryFilterRequested, resetQueryFilterRequested } from '../../store/shared.actions';
import { selectQueryFilter } from '../../store/shared.selectors';
import { QueryFilter } from '../../model/query-filter';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  animations: [fadeIn]
})
export class HeaderComponent implements OnInit {
  currentExperiment$: Observable<Experiment | null>;
  currentCrawler$: Observable<Crawler | null>;
  currentQueue$: Observable<Queue | null>;
  queryFilter$: Observable<QueryFilter[] | undefined>;
  hasFilter$: Observable<any>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.currentExperiment$ = this.store.select(selectCurrentExperiment);
    this.currentCrawler$ = this.store.select(selectCurrentCrawler);
    this.currentQueue$ = this.store.select(selectCurrentQueue);
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.hasFilter$ = combineLatest([
      this.currentExperiment$,
      this.currentCrawler$,
      this.currentQueue$,
      this.queryFilter$
    ]).pipe(map(([experiment, crawler, queue, queryFilter]) => experiment || crawler || queue || queryFilter?.length));
  }

  clearQueryFilter(): void {
    this.store.dispatch(clearQueryFilterRequested());
  }

  resetQueryFilter(filterName: string): void {
    this.store.dispatch(resetQueryFilterRequested({ filterName: filterName }));
  }

  resetExperimentFilter(event: any): void {
    this.store.dispatch(currentExperimentResetRequested());
  }

  resetCrawlerFilter(event: any): void {
    this.store.dispatch(currentCrawlerResetRequested());
  }

  resetQueueFilter(event: any): void {
    this.store.dispatch(currentQueueResetRequested());
  }
}
