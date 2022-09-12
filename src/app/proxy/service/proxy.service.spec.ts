import { TestBed } from '@angular/core/testing';
import { ExperimentService } from './proxy.service';

describe('ExperimentService', () => {
  let service: ExperimentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExperimentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
