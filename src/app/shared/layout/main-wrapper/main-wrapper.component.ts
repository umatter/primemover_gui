import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsSignedIn } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-main-wrapper',
  templateUrl: './main-wrapper.component.html',
  animations: [fadeIn]
})
export class MainWrapperComponent {
  isLoggedIn$: Observable<boolean>;

  constructor(private store: Store) {
    this.isLoggedIn$ = store.pipe(select(selectIsSignedIn));
  }
}
