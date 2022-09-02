import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap } from 'rxjs';
import { of } from 'rxjs';
import { CrawlerService } from '../service/crawler.service';
import {
  crawlerPageRequested,
  crawlersRequested,
  crawlersRequestFailed,
  crawlersRetrieved,
  initCrawlers
} from './crawler.actions';
import { currentExperimentResetRequested, experimentPageRequested } from '../../experiment/store/experiment.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';

@Injectable()
export class CrawlerEffects {
  initCrawlers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initCrawlers),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );
  crawlersRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(crawlersRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((response) => crawlersRetrieved({ collection: response })),
          catchError((error) => of(crawlersRequestFailed(error)))
        )
      )
    )
  );

  currentExperimentResetRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(currentExperimentResetRequested),
      map(() => crawlerPageRequested({ page: 1 }))
    )
  );
  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => crawlerPageRequested({ page: 1 }))
    )
  );

  crawlerPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(crawlerPageRequested),
      map(() => crawlersRequested())
    )
  );

  constructor(private actions$: Actions, private store: Store, private apiService: CrawlerService) {}
}
