import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, ReplaySubject, Subject, catchError, map, mergeMap, of, tap } from 'rxjs';

import { AppConfig } from '@app/app-config';
import { CONTEXT } from '@shared/error-handler/http-context';
import {
  DEFAULT_HEALTH_WINDOW,
  ExperimentHealth,
  healthWindowHours,
  normalizeExperimentHealth
} from '@app/experiment/model/health';

/**
 * How many `/health` calls are allowed in flight at once.
 *
 * The experiments grid renders a dozen cards and each one wants its own health. Twelve
 * simultaneous grouped queries is a real spike on a box that is also driving fifteen
 * browsers, and the researcher gains nothing from the twelfth arriving 200 ms earlier.
 */
export const EXPERIMENT_HEALTH_MAX_CONCURRENT = 4;

/**
 * Statuses that mean *this API does not have the endpoint*, as opposed to *this request
 * failed*. Only these latch the service off; a 500 or a dropped connection is transient
 * and must stay retryable.
 */
const ENDPOINT_MISSING_STATUSES: ReadonlySet<number> = new Set([404, 405, 501]);

/**
 * One request waiting for its turn in the concurrency gate. Its `sink` is what the caller
 * already holds, so the answer reaches them whenever the gate gets round to it.
 */
interface PendingHealthRequest {
  key: string;
  experimentId: number;
  hours: number;
  sink: ReplaySubject<ExperimentHealth | null>;
}

/**
 * Reads `GET /api/v1/experiments/{id}/health?hours=…`.
 *
 * The endpoint is new. This GUI has to keep working against the API deployed on ex63
 * today, which answers **404**, and the one rule that matters is what a 404 means: not
 * "this experiment is fine", but "we do not know". So every failure resolves to `null`,
 * every caller renders `null` as the neutral unknown state, and nothing here ever
 * `throw`s at the global error handler — a red toast on every experiments page load
 * against a not-yet-upgraded API would train people to ignore toasts.
 *
 * Three behaviours beyond the bare GET, each earning its keep:
 *
 * - **A cache per (experiment, window)**, shared through a `ReplaySubject`, so the twelve
 *   cards on a page and a revisit to the same page cost one request each at most.
 * - **A concurrency gate** ({@link EXPERIMENT_HEALTH_MAX_CONCURRENT}).
 * - **A missing-endpoint latch.** The first 404 turns the whole service off for the rest
 *   of the session, so an older API costs at most one gate-full of requests
 *   ({@link EXPERIMENT_HEALTH_MAX_CONCURRENT}, whatever was already in flight when the
 *   404 landed) rather than one per card, per page, forever. Retries are disabled on this
 *   call for the same reason: the shared error interceptor otherwise repeats every
 *   failure once.
 */
@Injectable({ providedIn: 'root' })
export class ExperimentHealthApiService {
  private readonly cache = new Map<string, Observable<ExperimentHealth | null>>();
  private readonly queue$ = new Subject<PendingHealthRequest>();
  private endpointMissing = false;

  /**
   * No retry: a 404 from an API without the endpoint is a definitive answer, and the
   * interceptor's default single retry would double the cost of discovering it.
   */
  private readonly noRetry = new HttpContext().set(CONTEXT, {
    retryConfig: { count: 0, delayTime: 0 },
    rethrow: true
  });

  constructor(
    private http: HttpClient,
    private config: AppConfig
  ) {
    this.queue$.pipe(mergeMap((request) => this.execute(request), EXPERIMENT_HEALTH_MAX_CONCURRENT)).subscribe();
  }

  /** True once the API has told us it has no such endpoint. Reads as *unknown*, not *clean*. */
  get unavailable(): boolean {
    return this.endpointMissing;
  }

  healthUrl(experimentId: number): string {
    return `${this.config.apiBaseUrl}/experiments/${experimentId}/health`;
  }

  /**
   * Health for one experiment over `hours`, or `null` when it cannot be known.
   *
   * Emits exactly once and completes. Never errors: see the class docblock.
   */
  health(
    experimentId: number,
    hours: number = healthWindowHours(DEFAULT_HEALTH_WINDOW)
  ): Observable<ExperimentHealth | null> {
    if (!Number.isFinite(experimentId) || experimentId <= 0) return of<ExperimentHealth | null>(null);
    if (this.endpointMissing) return of<ExperimentHealth | null>(null);

    const key = `${experimentId}:${hours}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const sink = new ReplaySubject<ExperimentHealth | null>(1);
    const stream = sink.asObservable();
    this.cache.set(key, stream);
    this.queue$.next({ key, experimentId, hours, sink });
    return stream;
  }

  /**
   * Drop cached health so the next read re-fetches — after scheduling a run, say.
   *
   * Deliberately does not clear {@link endpointMissing}: an API either has the endpoint or
   * does not, and re-probing it on every refresh is the N-requests problem again.
   */
  invalidate(experimentId?: number): void {
    if (experimentId === undefined) {
      this.cache.clear();
      return;
    }
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${experimentId}:`)) this.cache.delete(key);
    }
  }

  private execute(request: PendingHealthRequest): Observable<ExperimentHealth | null> {
    if (this.endpointMissing) {
      this.cache.delete(request.key);
      request.sink.next(null);
      request.sink.complete();
      return of<ExperimentHealth | null>(null);
    }

    return this.http
      .get<unknown>(this.healthUrl(request.experimentId), {
        params: new HttpParams().set('hours', String(request.hours)),
        context: this.noRetry
      })
      .pipe(
        map((payload): ExperimentHealth | null => normalizeExperimentHealth(payload)),
        catchError((error: HttpErrorResponse): Observable<ExperimentHealth | null> => {
          if (ENDPOINT_MISSING_STATUSES.has(error?.status)) this.endpointMissing = true;
          // Forget the entry so a transient failure can be retried on the next view;
          // the latch above is what stops a *permanent* failure being retried.
          this.cache.delete(request.key);
          return of<ExperimentHealth | null>(null);
        }),
        tap((health: ExperimentHealth | null) => {
          request.sink.next(health);
          request.sink.complete();
        })
      );
  }
}
