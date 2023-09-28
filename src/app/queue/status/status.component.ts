import { Component, Input } from '@angular/core';
import { QueueStatusEnum } from '@app/queue/status/status.enum';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html'
})
export class StatusComponent {
  @Input() statusCode: string | number;
  @Input() statusMessage?: string = '-';
  protected readonly QueueStatusEnum = QueueStatusEnum;

  constructor() {}
}
