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
        const payload = (action as any).payload;

        if (payload && data?.data) {
          (action as any).payload.data = data.data;
        }
        if (payload && data?.changes) {
          (action as any).payload.changes = data.changes;
        }

        if (payload && data?.meta) {
          (action as any).payload.pageMeta = data.meta;
        }

        if (payload && data?.links) {
          (action as any).payload.pageLinks = data.links;
        }
      }
      return action;
    };
  }
}
