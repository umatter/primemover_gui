import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { EntityAction, ofEntityOp, OP_ERROR } from '@ngrx/data';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { SharedActions } from '@shared/store/shared.actions';

/**
 * Surfaces @ngrx/data entity failures -- i.e. every CRUD call on jobs, queues,
 * crawlers and experiments -- to the user.
 *
 * They used to end in a `console.log`, so a save the API rejected looked to the
 * user exactly like a save that worked. They now go onto the same store error
 * the global notification renders.
 */
@Injectable({ providedIn: 'root' })
export class EntityErrorService {
  constructor(
    private actions$: Actions,
    private store: Store
  ) {
    this.actions$
      .pipe(
        ofEntityOp(),
        filter((ea: EntityAction) => ea.payload.entityOp.endsWith(OP_ERROR))
      )
      .subscribe((action: EntityAction) => {
        // The entity/op context cannot ride along on apiFailure, so keep it for
        // whoever is looking at the console.
        console.error(`[entity] ${action.payload.entityName} ${action.payload.entityOp} failed`, action);

        this.store.dispatch(SharedActions.apiFailure({ error: this.toHttpError(action) }));
      });
  }

  /**
   * Unwrap the failure. @ngrx/data sets `payload.data` to
   * `{error: DataServiceError, originalAction}`, and `DataServiceError.error`
   * is the original HttpErrorResponse the notification knows how to describe.
   */
  private toHttpError(action: EntityAction): any {
    const dataServiceError: any = action?.payload?.data?.error;

    return dataServiceError?.error ?? dataServiceError ?? action?.payload?.data;
  }
}
