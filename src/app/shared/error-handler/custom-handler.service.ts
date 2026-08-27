import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { BehaviorSubject, EMPTY } from 'rxjs';
import { Store } from '@ngrx/store';
import { SharedActions } from '@shared/store/shared.actions';
import { HttpResponseBase } from '@angular/common/http';

@Injectable()
export class CustomHandlerService implements ErrorHandler {
  store: Store;
  errorSubject = new BehaviorSubject<HttpResponseBase | null>(null);

  constructor(private injector: Injector) {}

  handleError(error: any) {
    this.store = this.injector.get(Store);
    this.errorSubject.next(error);

    // This handler replaces Angular's default one, which logs. Keep logging, or
    // an unhandled exception leaves no trace anywhere.
    console.error(error);

    const status: number | null = typeof error?.status === 'number' ? error.status : null;

    switch (true) {
      // Only 4xx/5xx is the API refusing us. The old test -- `error?.status > 200`
      // -- classified a 201 or 204 as an API failure and let a 200 fall through
      // to emptyFailure, which *clears* the error state instead of reporting it.
      case status !== null && status >= 400:
        this.store.dispatch(SharedActions.apiFailure({ error }));
        break;
      // status 0: the request never completed (offline, DNS, CORS, aborted).
      case status === 0:
        this.store.dispatch(SharedActions.clientFailure({ error }));
        break;
      case error instanceof ErrorEvent:
        this.store.dispatch(SharedActions.clientFailure({ error: { ...error, message: error?.type } }));
        break;
      // A plain JS exception, or one carrying a 2xx/3xx status: a client-side
      // bug, not something the user can act on. Stop the spinner, say nothing.
      default:
        this.store.dispatch(SharedActions.emptyFailure());
        break;
    }

    this.store.dispatch(SharedActions.loadingDone());
    return EMPTY;
  }
}
