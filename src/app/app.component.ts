import { Component } from '@angular/core';
import { fadeIn } from './shared/animation/trigger';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeIn]
})
export class AppComponent {
  title = 'primemover-frontend';
}
