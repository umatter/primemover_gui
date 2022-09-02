import { createAction, props } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';

export const initShared = createAction('[Shared] init');
export const clearQueryFilterRequested = createAction('[Shared] Clear query filter requested');
export const resetQueryFilterRequested = createAction('[Shared] Filter reset', props<{ filterName: string }>());
export const updateQueryFilter = createAction('[Shared] Filter update', props<{ updatedFilter: QueryFilter[] }>());
