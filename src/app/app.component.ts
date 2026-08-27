import { Component } from '@angular/core';
import { fadeIn } from '@shared/animation/trigger';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from './store/auth/auth.selectors';
import { EntityErrorService } from '@app/entity/entity-error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [fadeIn]
})
export class AppComponent {
  title = 'primemover-frontend';
  isLoggedIn$ = this.store.select(selectIsSignedIn);

  /**
   * `errorService` is injected purely to instantiate it.
   *
   * EntityErrorService is `providedIn: 'root'`, and its entire job -- turning every
   * @ngrx/data CRUD failure into an `apiFailure` the global notification renders --
   * happens in a subscription set up by its constructor. Angular creates a tree-shakable
   * root service on FIRST INJECTION, not at bootstrap, and until now the only injectors
   * were the two Agents screens. So a rejected save was reported on /agents and silent
   * on jobs, queues, crawlers, experiments and the workspace. AppComponent is the
   * bootstrap component, so injecting it here starts that subscription for the whole
   * session regardless of the route.
   */
  constructor(
    private store: Store,
    private errorService: EntityErrorService
  ) {}
}
