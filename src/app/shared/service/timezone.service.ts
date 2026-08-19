import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

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

/**
 * Timezone data resolved locally via the browser `Intl` API.
 *
 * Previously this called the external `worldtimeapi.org`, which is unreliable and returns a
 * network error (status 0) when unreachable — breaking run scheduling. `Intl` gives us the
 * timezone list and the current UTC offset offline, with no external dependency. The
 * `TimezoneDetail` shape is preserved; consumers only read `timezone`, `abbreviation` and
 * `utc_offset` (queue/run creators use `utc_offset`).
 */
@Injectable({ providedIn: 'root' })
export class TimezoneService {
  /** Sensible fallback if `Intl.supportedValuesOf` is unavailable. */
  private static readonly FALLBACK = [
    'UTC',
    'Europe/Berlin',
    'Europe/London',
    'Europe/Zurich',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo'
  ];

  getList(): Observable<string[]> {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    const list =
      typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : TimezoneService.FALLBACK;
    return of(list);
  }

  getDetail(timezone: string): Observable<TimezoneDetail> {
    return of(this.buildDetail(timezone));
  }

  /** Current UTC offset for a timezone, formatted like "+02:00" (matches the old API). */
  private offsetFor(timezone: string): string {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' }).formatToParts(
        new Date()
      );
      const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00';
      const offset = name.replace(/^GMT/, '').trim();
      return offset === '' ? '+00:00' : offset;
    } catch {
      return '+00:00';
    }
  }

  private abbreviationFor(timezone: string): string {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' }).formatToParts(
        new Date()
      );
      return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    } catch {
      return '';
    }
  }

  private buildDetail(timezone: string): TimezoneDetail {
    const utc_offset = this.offsetFor(timezone);
    const now = new Date();
    const [sign, hh, mm] = [utc_offset[0], utc_offset.slice(1, 3), utc_offset.slice(4, 6)];
    const raw_offset = (sign === '-' ? -1 : 1) * (Number(hh) * 3600 + Number(mm || '0') * 60);

    return {
      abbreviation: this.abbreviationFor(timezone),
      client_ip: '',
      datetime: now.toISOString(),
      day_of_week: now.getDay(),
      day_of_year: 0,
      dst: false,
      dst_from: '',
      dst_offset: 0,
      dst_until: '',
      raw_offset,
      timezone,
      unixtime: Math.floor(now.getTime() / 1000),
      utc_datetime: now.toISOString(),
      utc_offset,
      week_number: 0
    };
  }
}
