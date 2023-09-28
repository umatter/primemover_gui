import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './controls.component.html',
  imports: [NgxPaginationModule, TranslateModule],
  standalone: true
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
