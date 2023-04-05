import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { Proxy } from '../model/proxy';
import { Configuration } from '@app/config/model/config';
import { ProxyService } from '@app/entity/service';
import { selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { ProxyApiService } from '@app/proxy/service/proxy-api.service';
import { Meta } from '@shared/pagination/model';
import { requestPage } from '@shared/store/shared.actions';

@Component({
  selector: 'app-proxy',
  templateUrl: './proxy.component.html',
  styleUrls: ['./proxy.component.scss'],
  animations: [fadeIn]
})
export class ProxyComponent implements OnDestroy {
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<any>;
  isLoading$: Observable<boolean>;
  entityToDelete: Proxy | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(private store: Store, private entityService: ProxyService, private apiService: ProxyApiService) {
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
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  deleteRequested(entity: Configuration): void {
    this.entityToDelete = entity;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.entityService.delete(this.entityToDelete.id);
    }
    this.entityToDelete = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
