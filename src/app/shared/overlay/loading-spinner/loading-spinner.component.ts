import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  standalone: true,
  imports: [TranslateModule],
  animations: [fadeIn]
})
export class LoadingSpinnerComponent {
  constructor() {}
}
