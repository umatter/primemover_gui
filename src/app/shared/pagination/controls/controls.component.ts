import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pagination-controls',
  templateUrl: './controls.component.html'
})
export class ControlsComponent implements OnInit {
  @Input() id: string;

  @Output()
  pageChange = new EventEmitter<number>();

  constructor() {}

  ngOnInit(): void {
    console.log('ControlsComponent init');
  }

  onPageChange(event: any): void {
    this.pageChange.emit(event);
  }
}
