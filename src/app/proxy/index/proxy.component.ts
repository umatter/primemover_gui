import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { selectProxiesPagination } from '../store/proxy.selectors';
import { Proxy } from '../model/proxy';
import { Configuration } from '@app/config/model/config';
import { ProxyService } from '@app/entity/service';
import { selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { ProxyApiService } from '@app/proxy/service/proxy-api.service';

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

  private subscriptions = new Subscription();

  constructor(private store: Store, private entityService: ProxyService, private apiService: ProxyApiService) {
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
        .pipe(select(selectProxiesPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
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
