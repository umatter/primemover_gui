import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobState } from './job.reducer';
import { selectQueue } from '@app/queue/store/queue.selectors';

export const selectJob = createFeatureSelector<JobState>('job');
export const selectJobsPagination = createSelector(selectJob, (state) => state.pagination);
export const selectPageRequested = createSelector(selectJob, (state) => state.pageRequested || 1);
export const selectCurrentQueue = createSelector(selectQueue, (state) => state?.current || null);
