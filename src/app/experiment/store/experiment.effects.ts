import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { of } from 'rxjs';
import { ExperimentService } from '../service/experiment.service';
import {
  completeExperimentCreateRequested,
  experimentCreateError,
  experimentCreateSuccess,
  experimentDeleteError,
  experimentDeleteRequested,
  experimentDownloadRequested,
  experimentDeleteSuccess,
  experimentDownloadSuccess,
  experimentDownloadError,
  experimentPageRequested,
  experimentsRequested,
  experimentsRequestFailed,
  experimentsRetrieved,
  experimentsSimpleListRequested,
  experimentsSimpleListRetrieved
} from './experiment.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';
import { selectExperimentCreateFormValues } from './experiment.selectors';
import { TypedAction } from '@ngrx/store/src/models';
import { ExperimentFormValues } from '../component/model/experiment-form-values';
import { Router } from '@angular/router';

@Injectable()
export class ExperimentEffects {
  experimentsRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentsRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((collection) => experimentsRetrieved({ collection: collection })),
          catchError((error) => of(experimentsRequestFailed(error)))
        )
      )
    )
  );
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

  completeExperimentCreateRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeExperimentCreateRequested),
      withLatestFrom(this.store.pipe(select(selectExperimentCreateFormValues))),
      switchMap(([_, formValues]: [TypedAction<string>, any | undefined]) =>
        this.apiService.storeExperiment(formValues).pipe(
          map(((response) => { 
            this.apiService.newCreatedExperiment.next(true)
            return experimentCreateSuccess(response)
          })),
          catchError((err) => of(experimentCreateError(err)))
        )
      )
    )
  );

  experimentDeleteRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentDeleteRequested),
      switchMap((action) =>
        this.apiService.deleteExperiment(action.experimentId).pipe(
          map((response) => experimentDeleteSuccess(response)),
          catchError((err) => of(experimentDeleteError(err)))
        )
      )
    )
  );
  
  experimentDownloadRequested$ = createEffect(() =>
  this.actions$.pipe(
    ofType(experimentDownloadRequested),
    switchMap((action) =>
      this.apiService.downloadExperiment(action.experimentId).pipe(
        map((response) => experimentDeleteSuccess(response)),
        catchError((err) => of(experimentDownloadError(err)))
      )
    )
  )
);

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );

  // experimentCreateSuccess$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(experimentCreateSuccess),
  //       tap(() => this.router.navigate(['experiments']))
  //     ),
  //   { dispatch: false }
  // );
  experimentDownloadSuccess$ = createEffect(() =>
  this.actions$.pipe(
    ofType(experimentDownloadSuccess),
    map(() => experimentPageRequested({ page: 1 }))
  )
); 

  experimentDeleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentDeleteSuccess),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );

  experimentPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(experimentPageRequested),
      map(() => experimentsRequested())
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: ExperimentService,
    private router: Router
  ) {}
}
