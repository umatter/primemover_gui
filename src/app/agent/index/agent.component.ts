import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { selectAgentsPagination } from '../store/agent.selectors';
import { AgentService } from '@app/entity/service';
import { Agent } from '@app/agent/model/agent';
import { AgentApiService } from '@app/agent/service/agent-api.service';
import { selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  animations: [fadeIn]
})
export class AgentComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<any>;
  entityToDelete: Agent | null = null;
  queryFilter$: Observable<QueryFilter[]>;

  private subscriptions = new Subscription();

  constructor(private store: Store, public entityService: AgentService, private apiService: AgentApiService) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = entityService.loading$;
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.getData();
    //this.initPagination();
  }

  getData(page: number = 1): void {
    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectAgentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
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
}
