import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { PaginationType } from '@shared/pagination/type';
import { PaginationService } from '@shared/pagination/pagination.service';
import { selectPageRequested, selectSort } from '@shared/store/shared.reducer';
import { filter, first } from 'rxjs';
import { concatLatestFrom } from '@ngrx/effects';
import { SortDirection } from '@shared/model/sort';

@Injectable({
  providedIn: 'root'
})
export class CrawlerApiService {
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService,
    private paginationService: PaginationService
  ) {}

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/crawlers?filter[name]=${keyword}
    `);
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.CRAWLER);
  }

  getParams(): { [name: string]: any } {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Experiment]);

    this.store
      .select(selectPageRequested)
      .pipe(
        first(),
        filter((page) => Boolean(page)),
        concatLatestFrom(() => this.store.select(selectSort))
      )
      .subscribe(([pageRequested, sortData]) => {
        console.log('sortData', sortData);
        this.queryFilterParams = {
          ...this.queryFilterParams,
          page: pageRequested || 1,
          sort: sortData.sortDirection === SortDirection.ASC ? sortData.sortBy : `-${sortData.sortBy}`
        };
      });

    return this.queryFilterParams;
  }
}
