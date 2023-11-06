import { Component } from '@angular/core';
import { fadeIn } from '@shared/animation/trigger';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from './store/auth/auth.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeIn]
})
export class AppComponent {
  title = 'primemover-frontend';
  isLoggedIn$ = this.store.select(selectIsSignedIn);

  constructor(private store: Store) {}
}
