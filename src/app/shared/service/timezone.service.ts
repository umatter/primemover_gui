import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { httpContext } from '@shared/error-handler/http-context';

export interface TimezoneDetail {
  abbreviation: string;
  client_ip: string;
  datetime: string;
  day_of_week: number;
  day_of_year: number;
  dst: boolean;
  dst_from: string;
  dst_offset: number;
  dst_until: string;
  raw_offset: number;
  timezone: string;
  unixtime: number;
  utc_datetime: string;
  utc_offset: string;
  week_number: number;
}

@Injectable({ providedIn: 'root' })
export class TimezoneService {
  constructor(private httpClient: HttpClient) {}

  getList(): Observable<string[]> {
    return this.httpClient.get<string[]>('https://worldtimeapi.org/api/timezone', { context: httpContext });
  }

  getDetail(timezone: string): Observable<TimezoneDetail> {
    return this.httpClient.get<TimezoneDetail>('https://worldtimeapi.org/api/timezone/' + timezone, {
      context: httpContext
    });
  }
}
