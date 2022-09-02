import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobState } from './job.reducer';
import { selectQueue } from '../../queue/store/queue.selectors';

export const selectJob = createFeatureSelector<JobState>('job');
export const selectJobsList = createSelector(selectJob, (state) => state.collection);
export const selectJobsListData = createSelector(selectJob, (state) => state.collection.data);
export const selectJobsPagination = createSelector(selectJob, (state) => state.pagination);
export const selectCurrentPage = createSelector(selectJobsList, (state) => state.meta?.current_page || 1);
export const selectPageRequested = createSelector(selectJob, (state) => state.pageRequested || 1);
export const selectCurrentQueue = createSelector(selectQueue, (state) => state?.current || null);
export const selectIsLoading = createSelector(selectJob, (state) => state.isLoading);
