import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { AgentService } from '@app/entity/service';
import { Agent } from '@app/agent/model/agent';
import { AgentApiService } from '@app/agent/service/agent-api.service';
import { QueryFilter } from '@shared/model/query-filter';
import { Meta } from '@shared/pagination/model';
import { Router } from '@angular/router';
import { EntityErrorService } from '@app/entity/entity-error.service';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  animations: [fadeIn]
})
export class AgentComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Agent[] | any>;
  entityToDelete: Agent | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public entityService: AgentService,
    private apiService: AgentApiService,
    private router: Router,
    private errorService: EntityErrorService
  ) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = entityService.loading$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(SharedActions.requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  deleteRequested(agent: Agent): void {
    this.entityToDelete = agent;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete?.id) {
      this.entityService.delete(this.entityToDelete.id);
    }
    this.entityToDelete = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  editRequested(item: Agent) {
    this.router.navigate(['/agents', item.id, 'edit']).then();
  }
}
