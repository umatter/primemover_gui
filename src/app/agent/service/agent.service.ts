import { Injectable } from '@angular/core';
import { first, Observable, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DataCollection } from '../../shared/model/data-collection';
import { select, Store } from '@ngrx/store';
import { selectPageRequested } from '../store/agent.selectors';
import { AppConfig } from '../../app-config';
import { QueryFilterService } from '../../shared/service/query-filter.service';
import { AgentFormValues } from '../component/model/agent-form-values';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private pageRequested = 1;
  private queryFilterParams = {};

  constructor(
    private http: HttpClient,
    private store: Store,
    private config: AppConfig,
    private filterService: QueryFilterService
  ) { }

  public simpleIndex(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/agents-list`);
  }


  public agentList(): Observable<[]> {
    return this.http.get<[]>(`${this.config.apiBaseUrl}/agents`);
  }

  public index(): Observable<DataCollection> {
    this.store.pipe(select(selectPageRequested), first()).subscribe((response) => (this.pageRequested = response));

    const params = this.getParams();
    return this.http.get<DataCollection>(`${this.config.apiBaseUrl}/agents`, { params });
  }

  public storeAgent(AgentValues: AgentFormValues | undefined): Observable<any> {
    let agent = {
      name: AgentValues?.name,
      multilogin_profile: AgentValues?.multilogin_profile,
      multilogin_id: AgentValues?.multilogin_id,
      location: AgentValues?.location,
      identification: AgentValues?.identification,
      description: AgentValues?.description,
      active: AgentValues?.active,
    }
    return this.http.post<any>(`${this.config.apiBaseUrl}/agents`, agent);
  }

  public updateAgent(agentValues: AgentFormValues | undefined): Observable<any> {
    return this.http.put<any>(`${this.config.apiBaseUrl}/agents`, agentValues);
  }

  public deleteAgent(agentId: number): Observable<any> {
    return this.http.delete<any>(`${this.config.apiBaseUrl}/agents/${agentId}`);
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
