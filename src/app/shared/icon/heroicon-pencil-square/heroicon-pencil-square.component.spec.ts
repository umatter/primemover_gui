import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroiconPencilSquareComponent } from './heroicon-pencil-square.component';

describe('HeroiconPencilSquareComponent', () => {
  let component: HeroiconPencilSquareComponent;
  let fixture: ComponentFixture<HeroiconPencilSquareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeroiconPencilSquareComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroiconPencilSquareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
