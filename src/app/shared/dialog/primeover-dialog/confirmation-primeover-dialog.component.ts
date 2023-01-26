import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-primeover-dialog',
  templateUrl: './confirmation-primeover-dialog.component.html',
  styleUrls: ['./confirmation-primeover-dialog.component.scss']
})
export class ConfirmationPrimeoverDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,
    public confirmationDialog: MatDialogRef<ConfirmationPrimeoverDialogComponent>
  ) {}

  event = new EventEmitter();

  emitEvent(emitType: string) {
    this.event.emit(emitType);
  }
}
