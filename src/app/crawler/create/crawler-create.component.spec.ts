import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrawlerCreateComponent } from './crawler-create.component';

describe('CrawlerCreateComponent', () => {
  let component: CrawlerCreateComponent;
  let fixture: ComponentFixture<CrawlerCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrawlerCreateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CrawlerCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
