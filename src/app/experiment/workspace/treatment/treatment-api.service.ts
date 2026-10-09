import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { AppConfig } from '@app/app-config';
import { Configuration } from '@app/config/model/config';
import { Param } from '@app/config/model/param';
import { TreatmentDraft } from './treatment-model';

/**
 * The Treatment panel's calls. Params have no ngrx-data entity, and the panel reads them
 * through their configuration — the same `params` list, in the same order, the runner
 * reads.
 */
@Injectable({ providedIn: 'root' })
export class TreatmentApiService {
  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {}

  /** The configuration with its params and `crawlers_count`. */
  load(configurationId: number): Observable<Configuration> {
    return this.http
      .get<{ data: Configuration }>(`${this.config.apiBaseUrl}/configurations/${configurationId}`)
      .pipe(map((response) => response.data));
  }

  /**
   * The full row in one PUT. Lists go as arrays; the API stores the canonical JSON string
   * the runner needs and answers with it (umatter/primemover_api#85).
   */
  save(paramId: number, draft: TreatmentDraft): Observable<Param> {
    return this.http
      .put<{ data: Param }>(`${this.config.apiBaseUrl}/params/${paramId}`, draft)
      .pipe(map((response) => response.data));
  }

  /** A params row for a configuration that has none. The API fills the control arm. */
  create(configurationId: number): Observable<Param> {
    return this.http
      .post<{ data: Param }>(`${this.config.apiBaseUrl}/params`, { configuration_id: configurationId })
      .pipe(map((response) => response.data));
  }
}
