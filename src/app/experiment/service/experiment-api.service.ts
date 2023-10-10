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
import { QueryParams } from '@ngrx/data';
import { selectPageRequested } from '@shared/store/shared.reducer';

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

  public search(keyword: string): Observable<any[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments?filter[name]=${keyword}
    `);
  }

  public download(experimentId: any): Observable<HttpResponse<any>> {
    return this.http.get(
      `${this.config.apiBaseUrl}/experiments/${experimentId}/download
    `,
      { headers: {}, responseType: 'blob', observe: 'response' }
    );
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.EXPERIMENT);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent]);

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
