import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SharedState } from './shared.reducer';

export const selectShared = createFeatureSelector<SharedState>('shared');
export const selectQueryFilter = createSelector(selectShared, (state) => state.queryFilter || []);
