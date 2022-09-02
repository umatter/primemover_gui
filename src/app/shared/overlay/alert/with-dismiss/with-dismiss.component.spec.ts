import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithDismissComponent } from './with-dismiss.component';

describe('AlertWithDismissComponent', () => {
  let component: WithDismissComponent;
  let fixture: ComponentFixture<WithDismissComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WithDismissComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithDismissComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
