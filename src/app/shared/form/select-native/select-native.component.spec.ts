import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectNativeComponent } from './select-native.component';

describe('SelectNativeComponent', () => {
  let component: SelectNativeComponent;
  let fixture: ComponentFixture<SelectNativeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectNativeComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectNativeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
