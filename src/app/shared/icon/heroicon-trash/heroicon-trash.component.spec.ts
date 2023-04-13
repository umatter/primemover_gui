import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconTrashComponent } from './heroicon-trash.component';

describe('HeroiconTrashComponent', () => {
  let component: HeroiconTrashComponent;
  let fixture: ComponentFixture<HeroiconTrashComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeroiconTrashComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroiconTrashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
