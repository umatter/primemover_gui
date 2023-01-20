import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueCreateComponent } from './queue-create.component';

describe('QueueCraeteComponent', () => {
  let component: QueueCreateComponent;
  let fixture: ComponentFixture<QueueCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QueueCreateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(QueueCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
