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

    switch (true) {
      case error?.status > 200:
        this.store.dispatch(SharedActions.apiFailure({ error }));
        break;
      case error?.status === 0:
        this.store.dispatch(SharedActions.clientFailure({ error }));
        break;
      case error instanceof ErrorEvent:
        this.store.dispatch(SharedActions.clientFailure({ error: { ...error, message: error?.type } }));
        break;
      default:
        this.store.dispatch(SharedActions.emptyFailure());
        break;
    }

    this.store.dispatch(SharedActions.loadingDone());
    return EMPTY;
  }
}
