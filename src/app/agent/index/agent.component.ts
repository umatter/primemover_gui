import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { AgentService } from '@app/entity/service';
import { Agent } from '@app/agent/model/agent';
import { AgentApiService } from '@app/agent/service/agent-api.service';
import { selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { Meta } from '@shared/pagination/model';
import { requestPage } from '@shared/store/shared.actions';
import { PaginationType } from '@shared/pagination/type';

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

  constructor(private store: Store, public entityService: AgentService, private apiService: AgentApiService) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = entityService.loading$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(requestPage({ page }));

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
        this.paginationConfig = {
          id: PaginationType.AGENT,
          itemsPerPage: meta?.per_page,
          currentPage: meta?.current_page,
          totalItems: meta?.total
        };
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
}
