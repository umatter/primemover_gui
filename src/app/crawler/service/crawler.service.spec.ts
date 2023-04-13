import { TestBed } from '@angular/core/testing';
import { CrawlerApiService } from './crawler-api.service';

describe('CrawlerService', () => {
  let service: CrawlerApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrawlerApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
