import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap } from 'rxjs';
import { AgentApiService } from '../service/agent-api.service';
import { agentsRequestFailed, agentsSimpleListRequested, agentsSimpleListRetrieved } from './agent.actions';
import { AgentService } from '@app/entity/service';

@Injectable()
export class AgentEffects {
  agentsSimpleListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(agentsSimpleListRequested),
      switchMap(() =>
        this.apiService.simpleIndex().pipe(
          map((list) => agentsSimpleListRetrieved({ list })),
          catchError((error) => of(agentsRequestFailed(error)))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiService: AgentApiService,
    private entityService: AgentService
  ) {}
}
