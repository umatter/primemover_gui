import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  animations: [fadeIn]
})
export class LoadingSpinnerComponent {
  constructor() {}
}
