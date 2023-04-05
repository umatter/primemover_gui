import { Injectable } from '@angular/core';
import { filter, first, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType, selectRequestedPage } from '@shared/store/shared.selectors';

@Injectable({
  providedIn: 'root'
})
export class ProxyApiService {
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public proxies(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/proxies`);
  }

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/proxies?filter[search]=${keyword}
    `);
  }

  getParams(): QueryParams {
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Crawler]);

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
