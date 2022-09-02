import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WideButtonsCenteredComponent } from './wide-buttons-centered.component';

describe('WideButtonsCenteredComponent', () => {
  let component: WideButtonsCenteredComponent;
  let fixture: ComponentFixture<WideButtonsCenteredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WideButtonsCenteredComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WideButtonsCenteredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
