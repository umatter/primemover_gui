import { createFeatureSelector, createSelector } from '@ngrx/store';
import { QueueState } from './queue.reducer';

export const selectQueue = createFeatureSelector<QueueState>('queue');
export const selectQueuesList = createSelector(selectQueue, (state) => state.collection);
export const selectQueuesListData = createSelector(selectQueue, (state) => state.collection.data);
export const selectQueuesPagination = createSelector(selectQueue, (state) => state.pagination);
export const selectCurrentPage = createSelector(selectQueuesList, (state) => state.meta?.current_page || 1);
export const selectPageRequested = createSelector(selectQueue, (state) => state.pageRequested || 1);
export const selectCurrentQueue = createSelector(selectQueue, (state) => state?.current || null);
export const selectIsLoading = createSelector(selectQueue, (state) => state.isLoading);
