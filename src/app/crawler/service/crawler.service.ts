import { Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/crawler.selectors';
import { selectCurrentExperiment } from '../../experiment/store/experiment.selectors';
import { AppConfig } from '../../app-config';
import { QueryFilterService } from '../../shared/service/query-filter.service';

@Injectable({
  providedIn: 'root'
})
export class CrawlerService {
  private pageRequested = 1;
  private currentExperimentId: number | undefined;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) { }

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    this.store
      .pipe(select(selectCurrentExperiment), first())
      .subscribe((experiment) => (this.currentExperimentId = experiment?.id));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/crawlers`, { params });
  }

  public experimentData(): Observable<[DataCollection]> {
    return this.http.get<[DataCollection]>(`${this.config.apiBaseUrl}/experiments`);
  }

  public proxiesData(): Observable<[DataCollection]> {
    return this.http.get<[DataCollection]>(`${this.config.apiBaseUrl}/proxies`);
  }

  public agentList(): Observable<[DataCollection]> {
    return this.http.get<[DataCollection]>(`${this.config.apiBaseUrl}/agents`);
  }

  public configlist(): Observable<[DataCollection]> {
    return this.http.get<[DataCollection]>(`${this.config.apiBaseUrl}/configurations`);
  }


  public crawlerCreate(configurationValues: any | undefined): Observable<any> {
    let crawler = {
      agent_id: configurationValues.agent_id,
      configuration_id: configurationValues.configuration_id,
      description: configurationValues.description,
      experiment_id: configurationValues.experiment_id,
      name: configurationValues.name,
      proxy_id: configurationValues.proxy_id,
    }
    return this.http.post<any>(`${this.config.apiBaseUrl}/crawlers`, crawler);
  }

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/crawlers?filter[name]=${keyword}
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

    if (this.currentExperimentId) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        experiment: this.currentExperimentId
      };
    }
    return new HttpParams().appendAll(this.queryFilterParams);
  }
}
