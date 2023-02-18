import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationPrimeoverDialogComponent } from './confirmation-primeover-dialog.component';

describe('PrimeoverDialogComponent', () => {
  let component: ConfirmationPrimeoverDialogComponent;
  let fixture: ComponentFixture<ConfirmationPrimeoverDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmationPrimeoverDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationPrimeoverDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
