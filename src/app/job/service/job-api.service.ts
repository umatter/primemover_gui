import { Injectable } from '@angular/core';
import { filter, first } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';

import { selectPageRequested } from '../store/job.selectors';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType } from '@shared/store/shared.selectors';

@Injectable({
  providedIn: 'root'
})
export class JobApiService {
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/jobs?filter[name]=${keyword}
    `);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Queue]);

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
