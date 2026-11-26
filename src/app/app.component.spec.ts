import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { AppComponent } from './app.component';
import { EntityErrorService } from '@app/entity/entity-error.service';
import { selectIsSignedIn } from './store/auth/auth.selectors';

/**
 * The bootstrap component. Replaces the Angular CLI boilerplate that asserted a starter
 * page ("primemover-frontend app is running!") this app never had, and never ran
 * (umatter/primemover_gui#50).
 */
describe('AppComponent', () => {
  let constructed: number;
  let store: MockStore;

  /** Counts constructions: the service's whole job lives in its constructor. */
  class CountingErrorService {
    constructor() {
      constructed++;
    }
  }

  beforeEach(async () => {
    constructed = 0;
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({ selectors: [{ selector: selectIsSignedIn, value: false }] }),
        { provide: EntityErrorService, useClass: CountingErrorService }
      ],
      // app-container belongs to the layout module; this spec is about the shell's choice.
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    store = TestBed.inject(MockStore);
  });

  it('starts the global entity-error reporting, whatever the route', () => {
    TestBed.createComponent(AppComponent);
    expect(constructed).toBe(1);
  });

  it('shows the app layout only when signed in', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-container')).toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();

    store.overrideSelector(selectIsSignedIn, true);
    store.refreshState();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-container')).not.toBeNull();
  });
});
