import { Injectable } from '@angular/core';
import { filter, first, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType, selectRequestedPage } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { PaginatePipeArgs } from 'ngx-pagination';
import { PaginationType } from '@shared/pagination/type';
import { PaginationService } from '@shared/pagination/pagination.service';

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

  public download(keyword: any): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}/experiments/${keyword}/download
    `,{ responseType: 'blob' });
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.EXPERIMENT);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent]);

    this.store
      .select(selectRequestedPage)
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
