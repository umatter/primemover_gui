import { Injectable } from '@angular/core';
import { first, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/proxy.selectors';
import { AppConfig } from '../../app-config';
import { QueryFilterService } from '../../shared/service/query-filter.service';
import { ProxyFormValues } from '../component/model/proxy-form-values';

@Injectable({
  providedIn: 'root'
})
export class ProxyService {
  private pageRequested = 1;
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

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/proxies-list`);
  }

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/proxies`, { params });
  }

  public storeProxy(proxyValues: ProxyFormValues | undefined): Observable<any> {
    let proxy = {
      active: proxyValues?.active,
      description: proxyValues?.description,
      hostName: proxyValues?.hostName,
      name: proxyValues?.name,
      password: proxyValues?.password,
      port: proxyValues?.port,
      username: proxyValues?.username
    };
    return this.http.post<any>(`${this.config.apiBaseUrl}/proxies`, proxy);
  }

  public updateProxy(proxyValues: ProxyFormValues | undefined): Observable<any> {
    return this.http.put<any>(`${this.config.apiBaseUrl}/proxies`, proxyValues);
  }

  public search(keyword: string) {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/proxies?filter[search]=${keyword}
    `);
  }

  public deleteProxy(proxyId: number): Observable<any> {
    return this.http.delete<any>(`${this.config.apiBaseUrl}/proxies/${proxyId}`);
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
