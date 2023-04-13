import { Injectable } from '@angular/core';
import { filter, first } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType, selectRequestedPage } from '@shared/store/shared.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Meta } from '@shared/pagination/model';
import { PaginationType } from '@shared/pagination/type';
import { PaginationService } from '@shared/pagination/pagination.service';

@Injectable({
  providedIn: 'root'
})
export class JobApiService {
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService,
    private paginationService: PaginationService
  ) {}

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/jobs?filter[name]=${keyword}
    `);
  }

  getPaginateArgs(meta: Meta): PaginatePipeArgs {
    return this.paginationService.getPipeArgs(meta, PaginationType.JOB);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Queue]);

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
