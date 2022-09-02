import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WithFooterComponent } from './with-footer.component';

describe('AlertWithFooterComponent', () => {
  let component: WithFooterComponent;
  let fixture: ComponentFixture<WithFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WithFooterComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
