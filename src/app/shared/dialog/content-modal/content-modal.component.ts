import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-content-modal',
  templateUrl: './content-modal.component.html',
  animations: [
    trigger('opacity', [
      transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]),
      transition(':leave', [style({ opacity: 1 }), animate('200ms ease-in', style({ opacity: 0 }))])
    ]),
    trigger('opacityTranslateY', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(1rem)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(1rem)' }))
      ])
    ])
  ]
})
export class ContentModalComponent {
  @Input() isModal: boolean;
  @Output() modalResponse: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() {}

  toggleModal() {
    this.isModal = !this.isModal;
    this.modalResponse.emit(false);
  }

  onCancel() {
    this.modalResponse.emit(false);
  }

  onConfirm() {
    this.modalResponse.emit(true);
  }
}
