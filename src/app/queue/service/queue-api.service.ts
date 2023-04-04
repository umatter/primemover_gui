import { Injectable } from '@angular/core';
import { first } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/queue.selectors';
import { AppConfig } from '@app/app-config';
import { QueryFilterService } from '@shared/service/query-filter.service';
import { QueryParams } from '@ngrx/data';
import { QueryFilterType } from '@shared/store/shared.selectors';

@Injectable({
  providedIn: 'root'
})
export class QueueApiService {
  private pageRequested = 1;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/queues?filter[name]=${keyword}
    `);
  }

  getParams(): QueryParams {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));
    this.queryFilterParams = this.filterService.getFilterParams([QueryFilterType.Recent, QueryFilterType.Crawler]);

    if (this.pageRequested) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        page: this.pageRequested
      };
    }

    return this.queryFilterParams;
  }
}
