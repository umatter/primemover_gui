import { Injectable } from '@angular/core';
import { first, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/experiment.selectors';
import { AppConfig } from '../../app-config';
import { QueryFilterService } from '../../shared/service/query-filter.service';
import { ExperimentFormValues } from '../component/model/experiment-form-values';

@Injectable({
  providedIn: 'root'
})
export class ExperimentService {
  private pageRequested = 1;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) { }

  public list(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments`);
  }

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments-list`);
  }

  public search(keyword: string){
    return this.http.get<[]>(`${this.config.apiBaseUrl}/experiments?filter[name]=${keyword}
    `);
  }

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/experiments`, { params });
  }

  public storeExperiment(experimentValues: ExperimentFormValues | undefined): Observable<any> {
    return this.http.post<any>(`${this.config.apiBaseUrl}/experiments`, experimentValues);
  }

  public updateExperiment(experimentValues: ExperimentFormValues | undefined): Observable<any> {
    return this.http.put<any>(`${this.config.apiBaseUrl}/experiments`, experimentValues);
  }

  public deleteExperiment(experimentId: number): Observable<any> {
    return this.http.delete<any>(`${this.config.apiBaseUrl}/experiments/${experimentId}`);
  }

  getParams(): HttpParams {
    this.queryFilterParams = this.filterService.getFilterParams();

    if (this.pageRequested) {
      this.queryFilterParams = {
        ...this.queryFilterParams,
        page: this.pageRequested
      };
    }

    return new HttpParams().appendAll(this.queryFilterParams);
  }
}
