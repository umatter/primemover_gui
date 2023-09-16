import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconDownloadComponent } from './heroicon-download.component';

describe('HeroiconDownloadComponent', () => {
  let component: HeroiconDownloadComponent;
  let fixture: ComponentFixture<HeroiconDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeroiconDownloadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroiconDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
