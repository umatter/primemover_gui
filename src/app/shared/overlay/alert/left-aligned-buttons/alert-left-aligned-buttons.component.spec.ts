import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertLeftAlignedButtonsComponent } from './alert-left-aligned-buttons.component';

describe('AlertLeftAlignedButtonsComponent', () => {
  let component: AlertLeftAlignedButtonsComponent;
  let fixture: ComponentFixture<AlertLeftAlignedButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlertLeftAlignedButtonsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertLeftAlignedButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
