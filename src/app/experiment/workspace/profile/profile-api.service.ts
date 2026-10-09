import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { AppConfig } from '@app/app-config';
import { Configuration } from '@app/config/model/config';
import { PreferenceChange } from '@app/config/model/preference';

/**
 * The Profile panel's two calls, deliberately outside ngrx-data.
 *
 * `PUT configurations/{id}` answers `{status, data: configuration}` (the repository's
 * array, which JsonResource does not wrap again), unlike every other entity write. Routed
 * through the generic `ConfigurationService`, the entity cache would store `status` and
 * `data` as if they were configuration fields, and every other screen listing
 * configurations would read the corrupted row.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {}

  load(configurationId: number): Observable<Configuration> {
    return this.http.get<{ data: Configuration }>(this.url(configurationId)).pipe(map((response) => response.data));
  }

  /**
   * Sync the given preferences by name: the API updates those that exist, creates the
   * rest, and deletes nothing.
   *
   * `active` (the configuration's) is never sent: it was required-but-unreadable before
   * umatter/primemover_api#87, and a guessed `true` re-activates an inactive configuration.
   */
  savePreferences(
    configuration: Pick<Configuration, 'id' | 'name' | 'description'>,
    preferences: PreferenceChange[]
  ): Observable<Configuration> {
    return this.http
      .put<{ status: boolean; data: Configuration }>(this.url(configuration.id), {
        name: configuration.name,
        description: configuration.description,
        preferences
      })
      .pipe(map((response) => response.data));
  }

  private url(configurationId: number): string {
    return `${this.config.apiBaseUrl}/configurations/${configurationId}`;
  }
}
