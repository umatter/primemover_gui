import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ExperimentApiService } from '../service/experiment-api.service';
import {
  experimentPageRequested,
  experimentsRequested,
  experimentsRequestFailed,
  experimentsSimpleListRequested,
  experimentsSimpleListRetrieved
} from './experiment.actions';

@Injectable()
export class ExperimentEffects {
  experimentsSimpleListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentsSimpleListRequested),
      tap((val) => console.log(val)),
      switchMap(() =>
        this.apiService.simpleIndex().pipe(
          map((list) => experimentsSimpleListRetrieved({ list })),
          catchError((error) => of(experimentsRequestFailed(error)))
        )
      )
    )
  );

  experimentPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentPageRequested),
      map(() => experimentsRequested())
    )
  );

  constructor(private actions$: Actions, private store: Store, private apiService: ExperimentApiService) {}
}
