import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconPlusComponent } from './heroicon-plus.component';

describe('HeroiconPlusComponent', () => {
  let component: HeroiconPlusComponent;
  let fixture: ComponentFixture<HeroiconPlusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeroiconPlusComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroiconPlusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
