import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html'
})
export class StatusComponent {
  @Input() statusCode: string | number;
  @Input() statusMessage?: string = '-';

  constructor() {}

  isFailed(): boolean {
    return this.statusCode === 'failed';
  }

  isSuccess(): boolean {
    return this.statusCode === 'success';
  }

  isSkipped(): boolean {
    return this.statusCode === 'skipped';
  }

  isRunning(): boolean {
    return this.statusCode === 'running';
  }

  isUnknown(): boolean {
    return !this.statusCode;
  }
}
