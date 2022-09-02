import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithButtonsComponent } from './with-buttons.component';

describe('AlertWithButtonsComponent', () => {
  let component: WithButtonsComponent;
  let fixture: ComponentFixture<WithButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WithButtonsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
