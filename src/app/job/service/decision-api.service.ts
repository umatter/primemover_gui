import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppConfig } from '@app/app-config';

/**
 * Reads the raw decision payload for one job.
 *
 * `GET /api/v1/jobs/{id}/decision` serves the parsed `lambda-jobdata` object straight
 * from MinIO. It is the only way to see the **historical** verdicts: the `decision_*`
 * columns describe jobs run after the runner deploy, while the archived objects go back
 * to the start (6682 of them counted on 2026-09-07).
 *
 * It is fetched rather than linked. The API is bearer-authenticated by an HTTP
 * interceptor, so a plain `<a href>` to this URL would send no `Authorization` header and
 * hand the researcher a 401 that looks like "there is no payload" — the exact confusion
 * between *missing evidence* and *evidence of health* this whole change set exists to end.
 */
@Injectable({ providedIn: 'root' })
export class DecisionApiService {
  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {}

  /** The canonical URL, shown to the user so it can be copied for curl/scripts. */
  decisionUrl(jobId: number): string {
    return `${this.config.apiBaseUrl}/jobs/${jobId}/decision`;
  }

  fetchDecision(jobId: number): Observable<unknown> {
    return this.http.get<unknown>(this.decisionUrl(jobId));
  }
}
