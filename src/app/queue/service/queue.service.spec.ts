import { TestBed } from '@angular/core/testing';

import { QueueApiService } from './queue-api.service';

describe('QueueService', () => {
  let service: QueueApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueueApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
