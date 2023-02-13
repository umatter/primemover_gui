import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';

import { selectCurrentQueue, selectPageRequested } from '../store/job.selectors';
import { AppConfig } from '../../app-config';
import { selectQueryFilter } from '../../shared/store/shared.selectors';
import { QueryFilterService } from '../../shared/service/query-filter.service';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private pageRequested = 1;
  private currentQueueId: number | undefined;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    this.store.pipe(select(selectCurrentQueue), first()).subscribe((queue) => (this.currentQueueId = queue?.id));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/jobs`, { params });
  }

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/jobs?filter[name]=${keyword}
    `);
  }

  public deleteJob(jobId: number): Observable<any> {
    return this.http.delete<any>(`${this.config.apiBaseUrl}/jobs/${jobId}`);
  }

  getParams(): HttpParams {
    this.queryFilterParams = this.filterService.getFilterParams();

    if (this.pageRequested) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        page: this.pageRequested
      };
    }

    if (this.currentQueueId) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        queue: this.currentQueueId
      };
    }

    return new HttpParams().appendAll(this.queryFilterParams);
  }
}
