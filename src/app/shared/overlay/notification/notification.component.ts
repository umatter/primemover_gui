import { Component, Input } from '@angular/core';
import { fadeSlideInOut } from '../../animation/trigger';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  animations: [fadeSlideInOut]
})
export class NotificationComponent {
  @Input() typeError: boolean = false;
  @Input() typeSuccess: boolean = false;
  @Input() typeInfo: boolean = false;
  @Input() titleText: string = 'Notification';
  @Input() bodyText: string = 'Hello World!';
  showNotification: boolean = false;

  close(): void {
    this.typeError = false;
    this.typeInfo = false;
    this.typeSuccess = false;
    this.showNotification = false;
  }

  show(): boolean {
    if (this.typeError || this.typeSuccess || this.typeInfo) {
      this.showNotification = true;
      return true;
    }
    return false;
  }
}
