import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/queue.selectors';
import { selectCurrentCrawler } from '../../crawler/store/crawler.selectors';
import { AppConfig } from '../../app-config';
import { QueryFilterService } from '../../shared/service/query-filter.service';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private pageRequested = 1;
  private currentCrawlerId: number | undefined;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) {}

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    this.store
      .pipe(select(selectCurrentCrawler), first())
      .subscribe((crawler) => (this.currentCrawlerId = crawler?.id));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/queues`, { params });
  }

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/queues?filter[name]=${keyword}
    `);
  }

  getParams(): HttpParams {
    this.queryFilterParams = this.filterService.getFilterParams();

    if (this.pageRequested) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        page: this.pageRequested
      };
    }

    if (this.currentCrawlerId) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        crawler: this.currentCrawlerId
      };
    }
    return new HttpParams().appendAll(this.queryFilterParams);
  }
}
