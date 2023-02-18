import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { of } from 'rxjs';
import { CrawlerService } from '../service/crawler.service';
import {
  crawlerPageRequested,
  crawlersRequested,
  crawlersRequestFailed,
  crawlersRetrieved,
  initCrawlers,
  completeCrawlerCreateRequested,
  experimentCreateSuccess,
  experimentCreateError,
  experimentRequest,
  experimentsRetrieved,
  experimentRequestFailed,
  proxyRequest,
  proxiesRetrieved,
  proxyRequestFailed,
  agentRequest,
  agentsRetrieved,
  agentRequestFailed,
  configRequest,
  configsRetrieved,
  configRequestFailed,
  crawlerDeleteRequested,
  crawlerDeleteSuccess,
  crawlerDeleteError
} from './crawler.actions';
import { selectCrawlerCreateFormValues } from './crawler.selectors';
import { TypedAction } from '@ngrx/store/src/models';
import { currentExperimentResetRequested, experimentPageRequested } from '../../experiment/store/experiment.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';
import { Router } from '@angular/router';

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

  experimentRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentRequest),
      switchMap(() =>
        this.apiService.experimentData().pipe(
          map((response) => experimentsRetrieved({ collection: response })),
          catchError((error) => of(experimentRequestFailed(error)))
        )
      )
    )
  );

  proxyRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxyRequest),
      switchMap(() =>
        this.apiService.proxiesData().pipe(
          map((response) => proxiesRetrieved({ proxy: response })),
          catchError((error) => of(proxyRequestFailed(error)))
        )
      )
    )
  );

  agentRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentRequest),
      switchMap(() =>
        this.apiService.agentList().pipe(
          map((response) => agentsRetrieved({ agent: response })),
          catchError((error) => of(agentRequestFailed(error)))
        )
      )
    )
  );

  configRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configRequest),
      switchMap(() =>
        this.apiService.configlist().pipe(
          map((response) => configsRetrieved({ config: response })),
          catchError((error) => of(configRequestFailed(error)))
        )
      )
    )
  );

  completeCrawlerCreateRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeCrawlerCreateRequested),
      withLatestFrom(this.store.pipe(select(selectCrawlerCreateFormValues))),
      switchMap(([_, formValues]: [TypedAction<string>, any | undefined]) =>
        this.apiService.crawlerCreate(formValues).pipe(
          map((response) => experimentCreateSuccess(response)),
          catchError((err) => of(experimentCreateError(err)))
        )
      )
    )
  );

  experimentCreateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(experimentCreateSuccess),
        tap(() => this.router.navigate(['crawlers']))
      ),
    { dispatch: false }
  );

  crawlerDeleteRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(crawlerDeleteRequested),
      switchMap((action) =>
        this.apiService.deleteCrawler(action.crawlerId).pipe(
          map((response) => crawlerDeleteSuccess(response)),
          catchError((err) => of(crawlerDeleteError(err)))
        )
      )
    )
  );
  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: CrawlerService,
    private router: Router
  ) {}
}
