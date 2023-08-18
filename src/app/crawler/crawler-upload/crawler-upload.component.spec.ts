import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrawlerUploadComponent } from './crawler-upload.component';

describe('CrawlerUploadComponent', () => {
  let component: CrawlerUploadComponent;
  let fixture: ComponentFixture<CrawlerUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CrawlerUploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CrawlerUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
