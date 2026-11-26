import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { AppConfig } from '@app/app-config';

/** `GET crawlers/{id}/watched`: the ids the bot's decisions selected, newest first. */
@Injectable({ providedIn: 'root' })
export class WatchedApiService {
  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {}

  watched(botId: number): Observable<string[]> {
    return this.http
      .get<{ data: (string | number)[] }>(`${this.config.apiBaseUrl}/crawlers/${botId}/watched`)
      .pipe(map((response) => (response.data ?? []).map(String)));
  }
}
