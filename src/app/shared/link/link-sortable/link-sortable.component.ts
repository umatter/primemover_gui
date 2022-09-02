import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-link-sortable',
  templateUrl: './link-sortable.component.html'
})
export class LinkSortableComponent {
  @Input() href: string = '#';
  @Input() label: string = 'Label';
  @Input() sortIcon: boolean = false;

  constructor() {}
}
