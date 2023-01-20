import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueCraeteComponent } from './queue-craete.component';

describe('QueueCraeteComponent', () => {
  let component: QueueCraeteComponent;
  let fixture: ComponentFixture<QueueCraeteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QueueCraeteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QueueCraeteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
