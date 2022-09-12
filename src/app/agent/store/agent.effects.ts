import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, switchMap, tap, withLatestFrom } from 'rxjs';
import { of } from 'rxjs';
import { AgentService } from '../service/agent.service';
import {
  completeAgentCreateRequested,
  agentCreateError,
  agentCreateSuccess,
  agentDeleteError,
  agentDeleteRequested,
  agentDeleteSuccess,
  agentPageRequested,
  agentsRequested,
  agentsRequestFailed,
  agentsRetrieved, agentsSimpleListRequested, agentsSimpleListRetrieved, getAgetList,
  agentList
} from './agent.actions';
import { updateQueryFilter } from '../../shared/store/shared.actions';
import { selectAgentCreateFormValues } from './agent.selectors';
import { TypedAction } from '@ngrx/store/src/models';
import { AgentFormValues } from '../component/model/agent-form-values';
import { Router } from '@angular/router';

@Injectable()
export class AgentEffects {
  agentsRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentsRequested),
      switchMap(() =>
        this.apiService.index().pipe(
          map((collection) => agentsRetrieved({ collection: collection })),
          catchError((error) => of(agentsRequestFailed(error)))
        )
      )
    )
  );
  agentsSimpleListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentsSimpleListRequested),
      tap((val) => console.log(val)),
      switchMap(() =>
        this.apiService.simpleIndex().pipe(
          map((list) => agentsSimpleListRetrieved({ list })),
          catchError((error) => of(agentsRequestFailed(error)))
        )
      )
    )
  );

  completeAgentCreateRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(completeAgentCreateRequested),
      withLatestFrom(this.store.pipe(select(selectAgentCreateFormValues))),
      switchMap(([_, formValues]: [TypedAction<string>, AgentFormValues | undefined]) =>
        this.apiService.storeAgent(formValues).pipe(
          map((response) => agentCreateSuccess(response)),
          catchError((err) => of(agentCreateError(err)))
        )
      )
    )
  );

  agentDeleteRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentDeleteRequested),
      switchMap((action) =>
        this.apiService.deleteAgent(action.agentId).pipe(
          map((response) => agentDeleteSuccess(response)),
          catchError((err) => of(agentDeleteError(err)))
        )
      )
    )
  );

  updateQueryFilter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateQueryFilter),
      map(() => agentPageRequested({ page: 1 }))
    )
  );

  agentCreateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(agentCreateSuccess),
        tap(() => this.router.navigate(['agents']))
      ),
    { dispatch: false }
  );

  agentDeleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentDeleteSuccess),
      map(() => agentPageRequested({ page: 1 }))
    )
  );

  agentPageRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentPageRequested),
      map(() => agentsRequested())
    )
  );


  agentsListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getAgetList),
      tap((val) => console.log(val)),
      switchMap(() =>
        this.apiService.agentList().pipe(
          map((list) => agentList({ list })),
          catchError((error) => of(agentsRequestFailed(error)))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: AgentService,
    private router: Router
  ) { }
}
