import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, of, switchMap, withLatestFrom } from 'rxjs';
import {
  crawlerSelection,
  experimentSelection,
  queueSelection,
  resetQueryFilterRequested,
  updateQueryFilter
} from './shared.actions';
import { selectQueryFilter } from './shared.selectors';
import { CrawlerService, ExperimentService } from '@app/entity/service';

@Injectable()
export class SharedEffects {
  resetQueryFilterRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(resetQueryFilterRequested),
      withLatestFrom(this.store.pipe(select(selectQueryFilter))),
      map(([action, filterList]) =>
        updateQueryFilter({
          updatedFilter: filterList.filter((filter) => filter.name !== action.filterName)
        })
      )
    )
  );

  crawlerSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(crawlerSelection),
      switchMap((action) => {
        if (action.crawler?.experiment_id) {
          return this.experimentService.getByKey(action.crawler.experiment_id).pipe(
            map((experiment) => experimentSelection({ experiment })),
            catchError(() => of(experimentSelection({ experiment: null })))
          );
        }
        return of(experimentSelection({ experiment: null }));
      })
    )
  );

  queueSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(queueSelection),
      switchMap((action) => {
        if (action.queue?.crawler_id) {
          return this.crawlerService.getByKey(action.queue.crawler_id).pipe(
            map((crawler) => crawlerSelection({ crawler })),
            catchError(() => of(crawlerSelection({ crawler: null })))
          );
        }
        return of(crawlerSelection({ crawler: null }));
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService
  ) {}
}
