import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ExperimentHealthApiService } from './experiment-health-api.service';
import { AppConfig } from '@app/app-config';
import { ExperimentHealth } from '@app/experiment/model/health';
import { CONTEXT } from '@shared/error-handler/http-context';

/**
 * The endpoint is new; the API deployed on ex63 today answers **404**. What that 404 means
 * is the whole test: not "this experiment is fine" but "we do not know". So every failure
 * here has to resolve to `null` — never an exception that reaches the global error handler
 * and puts a red toast on a page that simply asked an older API a newer question.
 */
describe('ExperimentHealthApiService', () => {
  let service: ExperimentHealthApiService;
  let http: HttpTestingController;

  const BASE = 'http://localhost:8090/api/v1';

  const body = (over: Record<string, unknown> = {}) => ({
    experiment_id: 42,
    window_hours: 24,
    bots: 3,
    runs: { total: 4, running: 0, success: 3, warning: 1, failure: 0, skipped: 0, unknown: 0 },
    jobs: { total: 40, running: 0, success: 38, warning: 2, failure: 0, skipped: 0, unknown: 0 },
    bad_runs: 1,
    bad_jobs: 2,
    treatment_lost_jobs: 0,
    degraded_jobs: 2,
    last_finished_at: '2026-09-07T06:00:00Z',
    ...over
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AppConfig, useValue: { apiBaseUrl: BASE } }]
    });
    service = TestBed.inject(ExperimentHealthApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks the contract endpoint with the requested window', () => {
    let received: ExperimentHealth | null | undefined;
    service.health(42, 168).subscribe((health) => (received = health));

    const request = http.expectOne((r) => r.url === `${BASE}/experiments/42/health`);
    expect(request.request.params.get('hours')).toBe('168');
    request.flush(body());

    expect(received?.bad_runs).toBe(1);
    expect(received?.runs.warning).toBe(1);
  });

  it('defaults to the 24 h window', () => {
    service.health(42).subscribe();

    const request = http.expectOne((r) => r.url.includes('/health'));
    expect(request.request.params.get('hours')).toBe('24');
    request.flush(body());
  });

  it('degrades a 404 to unknown instead of throwing', () => {
    let received: ExperimentHealth | null | undefined = undefined;
    let errored = false;
    service.health(42, 24).subscribe({ next: (health) => (received = health), error: () => (errored = true) });

    http.expectOne((r) => r.url.includes('/health')).flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errored).withContext('a 404 must not reach the global error handler').toBeFalse();
    expect(received).withContext('null is the neutral unknown state the strip renders').toBeNull();
  });

  it('stops asking after the first 404 — an older API costs one request, not one per card', () => {
    service.health(1, 24).subscribe();
    http.expectOne((r) => r.url.includes('/health')).flush('', { status: 404, statusText: 'Not Found' });

    const answers: (ExperimentHealth | null)[] = [];
    service.health(2, 24).subscribe((health) => answers.push(health));
    service.health(3, 24).subscribe((health) => answers.push(health));

    http.expectNone((r) => r.url.includes('/health'));
    expect(service.unavailable).toBeTrue();
    expect(answers).toEqual([null, null]);
  });

  it('does not latch on a transient failure, and lets it be retried', () => {
    service.health(42, 24).subscribe();
    http.expectOne((r) => r.url.includes('/health')).flush('', { status: 500, statusText: 'Server Error' });

    expect(service.unavailable).withContext('a 500 is this request failing, not the endpoint missing').toBeFalse();

    let received: ExperimentHealth | null | undefined;
    service.health(42, 24).subscribe((health) => (received = health));
    http.expectOne((r) => r.url.includes('/health')).flush(body());

    expect(received?.bad_runs).toBe(1);
  });

  it('serves a dozen cards one request per experiment and window', () => {
    const seen: (ExperimentHealth | null)[] = [];
    service.health(42, 24).subscribe((health) => seen.push(health));
    service.health(42, 24).subscribe((health) => seen.push(health));

    http.expectOne((r) => r.url.includes('/experiments/42/health')).flush(body());

    expect(seen.length).toBe(2);
    expect(seen[0]).toBe(seen[1]!);

    // A different window is a different question and does re-ask.
    service.health(42, 720).subscribe();
    const wider = http.expectOne((r) => r.url.includes('/health'));
    expect(wider.request.params.get('hours')).toBe('720');
    wider.flush(body({ window_hours: 720 }));
  });

  it('re-reads after invalidate, so a newly scheduled run is not hidden by the cache', () => {
    service.health(42, 24).subscribe();
    http.expectOne((r) => r.url.includes('/health')).flush(body());

    service.invalidate(42);
    let received: ExperimentHealth | null | undefined;
    service.health(42, 24).subscribe((health) => (received = health));

    const refreshed = http.expectOne((r) => r.url.includes('/health'));
    refreshed.flush(body({ bad_runs: 2 }));

    expect(received?.bad_runs).toBe(2);
  });

  it('never asks for an experiment it has no id for', () => {
    let received: ExperimentHealth | null | undefined;
    service.health(Number.NaN).subscribe((health) => (received = health));

    http.expectNone((r) => r.url.includes('/health'));
    expect(received).toBeNull();
  });

  it('disables the interceptor retry, so discovering a missing endpoint costs one call', () => {
    // The shared error interceptor retries every failed request once by default. Against
    // an API without the endpoint that doubles the cost of learning it is not there, on
    // every card, so this call opts out explicitly.
    service.health(42, 24).subscribe();

    const request = http.expectOne((r) => r.url.includes('/health'));
    expect(request.request.context.get(CONTEXT).retryConfig.count).toBe(0);
    request.flush(body());
  });
});
