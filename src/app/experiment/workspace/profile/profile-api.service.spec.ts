import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppConfig } from '@app/app-config';
import { ProfileApiService } from './profile-api.service';

/**
 * F1: the two calls behind the Profile panel. Not ngrx-data, because PUT
 * configurations/{id} answers `{status, data: configuration}` — a shape the generic
 * entity cache would store as if `status` and `data` were configuration fields.
 */
describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppConfig, useValue: { apiBaseUrl: '/api/v1' } }
      ]
    });
    service = TestBed.inject(ProfileApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a configuration with its preferences', () => {
    let loaded: any;
    service.load(5).subscribe((c) => (loaded = c));

    http
      .expectOne('/api/v1/configurations/5')
      .flush({ data: { id: 5, name: 'arm A', preferences: [{ id: 1, name: 'location', value: 'X', active: 1 }] } });

    expect(loaded.id).toBe(5);
    expect(loaded.preferences.length).toBe(1);
  });

  it('PUTs name, description and the changed preferences — never active — and unwraps the reply', () => {
    let saved: any;
    service
      .savePreferences({ id: 5, name: 'arm A', description: 'left' }, [
        { name: 'location', value: 'CH-BE-BERN', active: true }
      ])
      .subscribe((c) => (saved = c));

    const req = http.expectOne('/api/v1/configurations/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      name: 'arm A',
      description: 'left',
      preferences: [{ name: 'location', value: 'CH-BE-BERN', active: true }]
    });
    expect('active' in req.request.body).toBeFalse();

    // The live shape, checked against the API: no outer `data` around the repository's array.
    req.flush({ status: true, data: { id: 5, name: 'arm A', preferences: [] } });
    expect(saved).toEqual({ id: 5, name: 'arm A', preferences: [] });
  });
});
