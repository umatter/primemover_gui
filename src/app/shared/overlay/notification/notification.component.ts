import { Component, EventEmitter, Input, Output } from '@angular/core';
import { fadeSlideInOut } from '../../animation/trigger';
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  standalone: true,
  imports: [NgIf],
  animations: [fadeSlideInOut]
})
export class NotificationComponent {
  @Input() typeError: boolean = false;
  @Input() typeSuccess: boolean = false;
  @Input() typeInfo: boolean = false;
  @Input() titleText: string = 'Notification';
  @Input() bodyText: string = 'Hello World!';
  @Input() error!: HttpErrorResponse | any;
  @Output() closeRequested = new EventEmitter<boolean>();

  showNotification: boolean = false;

  get show(): boolean {
    if (!this.error) {
      return this.close();
    }

    if (this.typeError || this.typeSuccess || this.typeInfo) {
      this.showNotification = true;
      return true;
    }

    return this.close();
  }

  close(): boolean {
    this.closeRequested.emit(true);

    return false;
  }
}
