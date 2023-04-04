import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Observable } from 'rxjs';

interface ListItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-autocomplete-select',
  templateUrl: './autocomplete-select.component.html',
  animations: [
    trigger('opacityLeave', [
      transition(':leave', [style({ opacity: 1 }), animate('100ms ease-in', style({ opacity: 0 }))])
    ])
  ]
})
export class AutocompleteSelectComponent {
  @Input() list$: Observable<any[]>;
  @Input() isSelect = false;
  @Output() isSelectChange = new EventEmitter<any>();

  current?: any;
  highlight?: any;

  constructor() {}

  toggleSelect() {
    this.isSelect = !this.isSelect;
  }

  select(item: any) {
    this.current = item;
    this.isSelectChange.emit(item);
    this.toggleSelect();
  }

  setHighlight(item: ListItem) {
    this.highlight = item;
  }
}
