import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { of } from 'rxjs';
import { ConfigService } from '../service/config.service';
import {
  completeConfigurationCreateRequested,
  configurationCreateError,
  configurationCreateSuccess,
  configurationDeleteError,
  configurationDeleteRequested,
  configurationDeleteSuccess,
  configurationPageRequested,
  configurationsRequested,
  configurationsRequestFailed,
  configurationsRetrieved,
  configurationsSimpleListRequested,
  configurationsSimpleListRetrieved
} from './config.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';
import { selectConfigurationCreateFormValues } from './config.selectors';
import { TypedAction } from '@ngrx/store/src/models';
import { ConfigurationFormValues } from '../component/model/config-form-values';
import { Router } from '@angular/router';

@Injectable()
export class ConfigEffects {
  configurationsRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationsRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((collection) => configurationsRetrieved({ collection: collection })),
          catchError((error) => of(configurationsRequestFailed(error)))
        )
      )
    )
  );
  configurationsSimpleListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationsSimpleListRequested),
      tap((val) => console.log(val)),
      switchMap(() =>
        this.apiService.simpleIndex().pipe(
          map((list) => configurationsSimpleListRetrieved({ list })),
          catchError((error) => of(configurationsRequestFailed(error)))
        )
      )
    )
  );

  completeConfigurationCreateRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeConfigurationCreateRequested),
      withLatestFrom(this.store.pipe(select(selectConfigurationCreateFormValues))),
      switchMap(([_, formValues]: [TypedAction<string>, ConfigurationFormValues | undefined]) =>
        this.apiService.storeConfiguration(formValues).pipe(
          map((response) => configurationCreateSuccess(response)),
          catchError((err) => of(configurationCreateError(err)))
        )
      )
    )
  );

  configurationDeleteRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationDeleteRequested),
      switchMap((action) =>
        this.apiService.deleteConfiguration(action.configurationId).pipe(
          map((response) => configurationDeleteSuccess(response)),
          catchError((err) => of(configurationDeleteError(err)))
        )
      )
    )
  );

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => configurationPageRequested({ page: 1 }))
    )
  );

  // configurationCreateSuccess$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(configurationCreateSuccess),
  //       tap(() => this.router.navigate(['configurations']))
  //     ),
  //   { dispatch: false }
  // );

  configurationDeleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationDeleteSuccess),
      map(() => configurationPageRequested({ page: 1 }))
    )
  );

  configurationPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationPageRequested),
      map(() => configurationsRequested())
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: ConfigService,
    private router: Router
  ) {}
}
