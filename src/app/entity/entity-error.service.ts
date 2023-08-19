import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { EntityAction, ofEntityOp, OP_ERROR } from '@ngrx/data';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EntityErrorService {
  constructor(private actions$: Actions) {
    actions$
      .pipe(
        ofEntityOp(),
        filter((ea: EntityAction) => ea.payload.entityOp.endsWith(OP_ERROR))
      )
      .subscribe((action) => {
        if (action.payload.entityOp.endsWith(OP_ERROR)) {
          console.log(action);
          console.log(action?.payload?.data?.error?.message);
          //entityService.createAndDispatch(EntityOp.UNDO_ONE);
        }
      });
  }
}
