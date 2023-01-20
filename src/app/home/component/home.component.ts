import { Component } from '@angular/core';
import { fadeIn } from '../../shared/animation/trigger';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  animations: [fadeIn]
})
export class HomeComponent {
  constructor() {}
}
