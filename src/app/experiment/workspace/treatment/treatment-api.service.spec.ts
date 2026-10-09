import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppConfig } from '@app/app-config';
import { TreatmentApiService } from './treatment-api.service';

/** F2: the params calls, against the response shapes the live API returns. */
describe('TreatmentApiService', () => {
  let service: TreatmentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfig, useValue: { apiBaseUrl: '/api/v1' } }
      ]
    });
    service = TestBed.inject(TreatmentApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('PUTs the whole row with lists as arrays, and unwraps {data}', () => {
    const draft = {
      pi: -0.4,
      psi: 0,
      kappa: 1,
      tau: 1,
      alpha: 0.3,
      beta: 0,
      search_terms: [{ term: 'climate', pi: -0.2 }],
      media_outlet_urls: []
    };
    let saved: any;
    service.save(8, draft).subscribe((p) => (saved = p));

    const req = http.expectOne('/api/v1/params/8');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(draft);
    req.flush({ data: { id: 8, pi: '-0.4', search_terms: '[{"term":"climate","pi":-0.2}]' } });

    expect(saved.id).toBe(8);
  });

  it('creates a params row for a configuration that has none', () => {
    let created: any;
    service.create(5).subscribe((p) => (created = p));

    const req = http.expectOne('/api/v1/params');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ configuration_id: 5 });
    req.flush({ data: { id: 12, pi: 0, psi: 0, kappa: 0, tau: 0, configuration_id: 5 } });

    expect(created.id).toBe(12);
  });
});
