import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProxyCreateComponent } from './proxy-create.component';

describe('ExperimentCreateComponent', () => {
  let component: ProxyCreateComponent;
  let fixture: ComponentFixture<ProxyCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProxyCreateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProxyCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
