import { Injectable } from '@angular/core';
import { filter, first, Observable } from 'rxjs';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { PaginationType } from '@shared/pagination/type';
import { PaginationService } from '@shared/pagination/pagination.service';
import { selectPageRequested, selectSort } from '@shared/store/shared.reducer';
import { httpContext } from '@shared/error-handler/http-context';
import { SortDirection } from '@shared/model/sort';
import { concatLatestFrom } from '@ngrx/effects';
import { Runner } from '../model/runner';

@Injectable({
  providedIn: 'root'
})
export class ExperimentApiService {
  queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService,
    private paginationService: PaginationService
  ) {}

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments-list`);
  }

  /** The runner accounts an experiment can be assigned to, default flagged. */
  public runners(): Observable<Runner[]> {
    return this.http.get<Runner[]>(`${this.config.apiBaseUrl}/runners`);
  }

  public search(keyword: string): Observable<any[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments?filter[name]=${keyword}
    `);
  }

  public download(experimentId: any): Observable<HttpResponse<any>> {
    return this.http.get(
      `${this.config.apiBaseUrl}/experiments/${experimentId}/download
    `,
      { headers: {}, responseType: 'blob', observe: 'response', context: httpContext }
    );
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.EXPERIMENT);
  }

  getParams(): { [name: string]: any } {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent]);

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
