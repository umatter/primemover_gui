import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { Configuration } from '../model/config';
import { ConfigurationService } from '@app/entity/service';
import { QueryFilter } from '@shared/model/query-filter';
import { ConfigApiService } from '@app/config/service/config-api.service';
import { Meta } from '@shared/pagination/model';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  animations: [fadeIn]
})
export class ConfigComponent implements OnDestroy {
  entityToDelete: Configuration | null = null;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Configuration[] | any>;
  isLoading$: Observable<boolean>;
  queryFilter$: Observable<QueryFilter[]>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(private store: Store, private entityService: ConfigurationService, private apiService: ConfigApiService) {
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
