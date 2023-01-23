import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-primeover-dialog',
  templateUrl: './confirmation-primeover-dialog.component.html',
  styleUrls: ['./confirmation-primeover-dialog.component.scss']
})
export class ConfirmationPrimeoverDialogComponent {
  constructor(
    public dialog: MatDialog,
    public confirmationDialog: MatDialogRef<ConfirmationPrimeoverDialogComponent>
  ) {}

  @Input() title: string='title'
  @Input() description: string='description'
  @Input() cancelButtonName: string='cancel'
  @Input() otherButtonName: string='accept'

  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onButtonClick = new EventEmitter();

  emitEvent(emitType: string) {
    this.onButtonClick.emit(emitType);
  }
}
