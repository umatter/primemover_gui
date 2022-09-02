import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectBrandedComponent } from './select-branded.component';

describe('SelectBrandedComponent', () => {
  let component: SelectBrandedComponent;
  let fixture: ComponentFixture<SelectBrandedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectBrandedComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectBrandedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
