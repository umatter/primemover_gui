import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { selectConfigurationsPagination } from '../store/config.selectors';
import { Configuration } from '../model/config';
import { ConfigurationService } from '@app/entity/service';
import { QueryFilter } from '@shared/model/query-filter';
import { selectQueryFilter } from '@shared/store/shared.selectors';
import { ConfigApiService } from '@app/config/service/config-api.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  animations: [fadeIn]
})
export class ConfigComponent implements OnDestroy {
  entityToDelete: Configuration | null = null;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<any>;
  isLoading$: Observable<boolean>;
  queryFilter$: Observable<QueryFilter[]>;

  private subscriptions = new Subscription();

  constructor(private store: Store, private entityService: ConfigurationService, private apiService: ConfigApiService) {
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
        .pipe(select(selectConfigurationsPagination))
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
