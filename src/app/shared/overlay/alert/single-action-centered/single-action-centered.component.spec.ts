import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleActionCenteredComponent } from './single-action-centered.component';

describe('SingleActionCenteredComponent', () => {
  let component: SingleActionCenteredComponent;
  let fixture: ComponentFixture<SingleActionCenteredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SingleActionCenteredComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleActionCenteredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
