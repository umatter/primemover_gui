import { TestBed } from '@angular/core/testing';

import { BehaviorApiService } from './behavior-api.service';

describe('BehaviorApiService', () => {
  let service: BehaviorApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BehaviorApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
