import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { of } from 'rxjs';
import { ProxyService } from '../service/proxy.service';
import {
  completeProxyCreateRequested,
  proxyCreateError,
  proxyCreateSuccess,
  proxyDeleteError,
  proxyDeleteRequested,
  proxyDeleteSuccess,
  proxyPageRequested,
  proxiesRequested,
  proxiesRequestFailed,
  proxiesRetrieved,
  proxiesSimpleListRequested,
  proxiesSimpleListRetrieved
} from './proxy.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';
import { selectProxyCreateFormValues } from './proxy.selectors';
import { TypedAction } from '@ngrx/store/src/models';
import { ProxyFormValues } from '../component/model/proxy-form-values';
import { Router } from '@angular/router';
import { initJobs } from 'src/app/job/store/job.actions';
import { experimentPageRequested } from 'src/app/experiment/store/experiment.actions';

@Injectable()
export class ProxyEffects {
///

initJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initJobs),
      map(() => experimentPageRequested({ page: 1 }))
    )
  );

  ///
  proxiesRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxiesRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((collection) => proxiesRetrieved({ collection: collection })),
          catchError((error) => of(proxiesRequestFailed(error)))
        )
      )
    )
  );
  proxiesSimpleListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxiesSimpleListRequested),
      tap((val) => console.log(val)),
      switchMap(() =>
        this.apiService.simpleIndex().pipe(
          map((list) => proxiesSimpleListRetrieved({ list })),
          catchError((error) => of(proxiesRequestFailed(error)))
        )
      )
    )
  );

  completeProxyCreateRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeProxyCreateRequested),
      withLatestFrom(this.store.pipe(select(selectProxyCreateFormValues))),
      switchMap(([_, formValues]: [TypedAction<string>, ProxyFormValues | undefined]) =>
        this.apiService.storeProxy(formValues).pipe(
          map((response) => proxyCreateSuccess(response)),
          catchError((err) => of(proxyCreateError(err)))
        )
      )
    )
  );

  proxyDeleteRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxyDeleteRequested),
      switchMap((action) =>
        this.apiService.deleteProxy(action.proxyId).pipe(
          map((response) => proxyDeleteSuccess(response)),
          catchError((err) => of(proxyDeleteError(err)))
        )
      )
    )
  );

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => proxyPageRequested({ page: 1 }))
    )
  );

  // proxyCreateSuccess$ = createEffect(
  //   () =>
  //     this.actions$.pipe(
  //       ofType(proxyCreateSuccess),
  //       tap(() => this.router.navigate(['proxies']))
  //     ),
  //   { dispatch: false }
  // );

  proxyDeleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxyDeleteSuccess),
      map(() => proxyPageRequested({ page: 1 }))
    )
  );

  proxyPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(proxyPageRequested),
      map(() => proxiesRequested())
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: ProxyService,
    private router: Router
  ) {}
}
