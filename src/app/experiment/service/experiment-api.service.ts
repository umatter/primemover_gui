import { Injectable } from '@angular/core';
import { filter, first, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { selectPageRequested } from '../store/experiment.selectors';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType } from '@shared/store/shared.selectors';

@Injectable({
  providedIn: 'root'
})
export class ExperimentApiService {
  queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments-list`);
  }

  public search(keyword: string): Observable<any[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments?filter[name]=${keyword}
    `);
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
