import { Component } from '@angular/core';
import { fadeIn } from '@shared/animation/trigger';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsSignedIn } from './store/auth/auth.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeIn]
})
export class AppComponent {
  title = 'primemover-frontend';

  isLoggedIn$: Observable<boolean>;

  constructor(private store: Store) {
    this.isLoggedIn$ = this.store.pipe(select(selectIsSignedIn));
  }
}
