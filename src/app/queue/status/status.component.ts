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

  isUnknown(): boolean {
    return !this.statusCode;
  }
}
