import { Injectable } from '@angular/core';
import { filter, first, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { PaginationType } from '@shared/pagination/type';
import { PaginationService } from '@shared/pagination/pagination.service';
import { selectPageRequested } from '@shared/store/shared.reducer';

@Injectable({
  providedIn: 'root'
})
export class AgentApiService {
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService,
    private paginationService: PaginationService
  ) {}

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/agents-list`);
  }

  search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/agents?filter[search]=${keyword}
    `);
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.AGENT);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Crawler]);

    this.store
      .select(selectPageRequested)
      .pipe(
        first(),
        filter((page) => Boolean(page))
      )
      .subscribe((pageRequested) => {
        this.queryFilterParams = {
          ...this.queryFilterParams,
          page: pageRequested || 1
        };
      });

    return this.queryFilterParams;
  }
}
