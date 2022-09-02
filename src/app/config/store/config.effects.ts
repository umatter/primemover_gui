import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { map } from 'rxjs';
import { setAppConfig } from './config.actions';
import { AppConfig } from '../../app-config';

@Injectable()
export class ConfigEffects {
  setAppConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => {
        return setAppConfig({ appConfig: this.config });
      })
    )
  );

  constructor(private actions$: Actions, private config: AppConfig) {}
}
