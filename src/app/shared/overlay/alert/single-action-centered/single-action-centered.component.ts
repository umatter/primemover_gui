import { Component } from '@angular/core';
import { modalAnimated } from '../../../animation/trigger';

@Component({
  selector: 'app-single-action-centered',
  templateUrl: './single-action-centered.component.html',
  animations: [modalAnimated]
})
export class SingleActionCenteredComponent {
  constructor() {}
}
