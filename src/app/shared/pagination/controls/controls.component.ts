import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './controls.component.html'
})
export class ControlsComponent {
  @Input() id: string;

  @Output()
  pageChange = new EventEmitter<number>();

  constructor() {}

  onPageChange(event: any): void {
    this.pageChange.emit(event);
  }
}
