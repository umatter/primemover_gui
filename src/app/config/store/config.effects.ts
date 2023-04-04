import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ConfigApiService } from '../service/config-api.service';
import {
  configurationPageRequested,
  configurationsRequested,
  configurationsRequestFailed,
  configurationsSimpleListRequested,
  configurationsSimpleListRetrieved
} from './config.actions';

@Injectable()
export class ConfigEffects {
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

  configurationPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configurationPageRequested),
      map(() => configurationsRequested())
    )
  );

  constructor(private actions$: Actions, private store: Store, private apiService: ConfigApiService) {}
}
