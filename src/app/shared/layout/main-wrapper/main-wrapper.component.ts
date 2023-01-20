import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';

@Component({
  selector: 'app-main-wrapper',
  templateUrl: './main-wrapper.component.html',
  animations: [fadeIn]
})
export class MainWrapperComponent {
  constructor() {}
}
