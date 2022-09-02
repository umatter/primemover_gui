import { Action, createReducer, on } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { clearQueryFilterRequested, initShared, updateQueryFilter } from './shared.actions';

export interface SharedState {
  queryFilter?: QueryFilter[];
}

export const initialState: SharedState = {
  queryFilter: [
    {
      name: 'recent',
      value: 30
    }
  ]
};

const reducer = createReducer(
  initialState,
  on(initShared, () => initialState),
  on(clearQueryFilterRequested, (state) => ({ ...state, queryFilter: undefined })),
  on(updateQueryFilter, (state, action) => ({ ...state, queryFilter: action.updatedFilter }))
);

export function sharedReducer(state: SharedState | undefined, action: Action): any {
  return reducer(state, action);
}
