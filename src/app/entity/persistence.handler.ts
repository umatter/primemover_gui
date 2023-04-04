import { Action } from '@ngrx/store';
import { DefaultPersistenceResultHandler, EntityAction } from '@ngrx/data';
import { Injectable } from '@angular/core';

@Injectable()
export class AdditionalPersistenceResultHandler extends DefaultPersistenceResultHandler {
  override handleSuccess(originalAction: EntityAction): (data: any) => Action {
    const actionHandler = super.handleSuccess(originalAction);
    return (data: any) => {
      const action = actionHandler.call(this, data);
      if (action && data) {
        (action as any).payload.data = data.data;
        // (action as any).payload.someOtherProperty = data.someOtherProperty;
      }
      return action;
    };
  }
}
