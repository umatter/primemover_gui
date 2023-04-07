import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconUploadComponent } from './heroicon-upload.component';

describe('HeroiconUploadComponent', () => {
  let component: HeroiconUploadComponent;
  let fixture: ComponentFixture<HeroiconUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeroiconUploadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroiconUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
