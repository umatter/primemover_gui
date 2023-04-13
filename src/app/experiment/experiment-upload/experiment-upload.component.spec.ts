import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentUploadComponent } from './experiment-upload.component';

describe('ExperimentUploadComponent', () => {
  let component: ExperimentUploadComponent;
  let fixture: ComponentFixture<ExperimentUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExperimentUploadComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
