import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-link-sortable',
  templateUrl: './link-sortable.component.html',
  imports: [NgIf],
  standalone: true
})
export class LinkSortableComponent {
  @Input() href: string = '#';
  @Input() label: string = 'Label';
  @Input() sortIcon: boolean = false;

  constructor() {}
}
