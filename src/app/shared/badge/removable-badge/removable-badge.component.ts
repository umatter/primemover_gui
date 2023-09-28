import { Component, EventEmitter, Input, Output } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-removable-badge',
  templateUrl: './removable-badge.component.html',
  animations: [fadeIn],
  imports: [NgIf],
  standalone: true
})
export class RemovableBadgeComponent {
  @Input() sizeSmall: boolean;
  @Input() pillStyle: boolean;
  @Input() label = 'Rename me!';
  @Input() link = '';
  @Output() clickEvent = new EventEmitter<void>();

  constructor() {}

  onClick(event: any): void {
    this.clickEvent.emit(event);
  }
}
