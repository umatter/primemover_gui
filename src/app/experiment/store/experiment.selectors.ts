import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExperimentState } from './experiment.reducer';

export const selectExperiment = createFeatureSelector<ExperimentState>('experiment');
export const selectExperimentsPagination = createSelector(selectExperiment, (state) => state.pagination);
export const selectPageRequested = createSelector(selectExperiment, (state) => state.pageRequested || 1);
export const selectExperimentCreateFormValues = createSelector(selectExperiment, (state) => state?.form);
