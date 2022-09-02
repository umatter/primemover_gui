import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap } from 'rxjs';
import { of } from 'rxjs';
import { experimentPageRequested } from '../../experiment/store/experiment.actions';
import { JobService } from '../service/job.service';
import { initJobs, jobPageRequested, jobsRequested, jobsRequestFailed, jobsRetrieved } from './job.actions';
import { currentQueueResetRequested } from '../../queue/store/queue.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';

@Injectable()
export class JobEffects {
  initJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initJobs),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );
  jobsRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobsRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((response) => jobsRetrieved({ collection: response })),
          catchError((error) => of(jobsRequestFailed(error)))
        )
      )
    )
  );

  currentQueueResetRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(currentQueueResetRequested),
      map(() => jobPageRequested({ page: 1 }))
    )
  );

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => jobPageRequested({ page: 1 }))
    )
  );

  jobPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(jobPageRequested),
      map(() => jobsRequested())
    )
  );

  constructor(private actions$: Actions, private store: Store, private apiService: JobService) {}
}
