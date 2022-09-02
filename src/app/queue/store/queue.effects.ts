import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap } from 'rxjs';
import { of } from 'rxjs';

import { experimentPageRequested } from '../../experiment/store/experiment.actions';
import { QueueService } from '../service/queue.service';
import { initQueues, queuePageRequested, queuesRequested, queuesRequestFailed, queuesRetrieved } from './queue.actions';
import { currentCrawlerResetRequested } from '../../crawler/store/crawler.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';

@Injectable()
export class QueueEffects {
  initQueues$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initQueues),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );
  queuesRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(queuesRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((response) => queuesRetrieved({ collection: response })),
          catchError((error) => of(queuesRequestFailed(error)))
        )
      )
    )
  );

  currentCrawlerResetRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(currentCrawlerResetRequested),
      map(() => queuePageRequested({ page: 1 }))
    )
  );

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => queuePageRequested({ page: 1 }))
    )
  );

  queuePageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(queuePageRequested),
      map(() => queuesRequested())
    )
  );

  constructor(private actions$: Actions, private store: Store, private apiService: QueueService) {}
}
