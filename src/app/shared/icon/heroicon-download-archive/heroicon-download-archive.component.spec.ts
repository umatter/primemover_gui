import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconDownloadArchiveComponent } from './heroicon-download-archive.component';

describe('HeroiconDownloadArchiveComponent', () => {
  let component: HeroiconDownloadArchiveComponent;
  let fixture: ComponentFixture<HeroiconDownloadArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeroiconDownloadArchiveComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroiconDownloadArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
