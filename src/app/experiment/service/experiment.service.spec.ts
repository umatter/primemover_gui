import { TestBed } from '@angular/core/testing';
import { ExperimentApiService } from './experiment-api.service';

describe('ExperimentService', () => {
  let service: ExperimentApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperimentApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
