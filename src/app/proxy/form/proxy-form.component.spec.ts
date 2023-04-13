import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProxyFormComponent } from './proxy-form.component';

describe('ExperimentCreateComponent', () => {
  let component: ProxyFormComponent;
  let fixture: ComponentFixture<ProxyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProxyFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProxyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
