import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrawlerCreateComponent } from './experiment-create.component';

describe('ExperimentCreateComponent', () => {
  let component: CrawlerCreateComponent;
  let fixture: ComponentFixture<CrawlerCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CrawlerCreateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CrawlerCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
