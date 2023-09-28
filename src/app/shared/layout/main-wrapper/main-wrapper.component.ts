import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsSignedIn } from '@app/store/auth/auth.selectors';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@shared/layout/header/header.component';
import { MetadataComponent } from '@shared/metadata/metadata.component';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-main-wrapper',
  templateUrl: './main-wrapper.component.html',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, MetadataComponent, AsyncPipe, NgIf],
  animations: [fadeIn]
})
export class MainWrapperComponent {
  isLoggedIn$: Observable<boolean>;

  constructor(private store: Store) {
    this.isLoggedIn$ = store.pipe(select(selectIsSignedIn));
  }
}
