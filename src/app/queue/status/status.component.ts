import { Component, Input } from '@angular/core';
import { QueueStatusEnum } from '@app/queue/status/status.enum';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault, TranslateModule],
  standalone: true
})
export class StatusComponent {
  @Input() statusCode: string | number;
  @Input() statusMessage?: string = '-';
  protected readonly QueueStatusEnum = QueueStatusEnum;

  constructor() {}
}
