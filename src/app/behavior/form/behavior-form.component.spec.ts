import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BehaviorFormComponent } from './behavior-form.component';

describe('BehaviorFormComponent', () => {
  let component: BehaviorFormComponent;
  let fixture: ComponentFixture<BehaviorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BehaviorFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BehaviorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
