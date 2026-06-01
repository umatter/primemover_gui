import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '@app/store/auth/auth.selectors';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { selectError } from '@shared/store/shared.reducer';
import { SharedActions } from '@shared/store/shared.actions';

@Component({
  selector: 'app-main-wrapper',
  templateUrl: './main-wrapper.component.html',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NgIf, NotificationComponent],
  animations: [fadeIn]
})
export class MainWrapperComponent {
  isLoggedIn$ = this.store.select(selectIsSignedIn);
  error$ = this.store.select(selectError);

  constructor(private store: Store) {}

  dismiss() {
    this.store.dispatch(SharedActions.errorResetRequested());
  }
}
