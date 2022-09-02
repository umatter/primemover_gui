import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExperimentState } from './experiment.reducer';

export const selectExperiment = createFeatureSelector<ExperimentState>('experiment');
export const selectExperimentsList = createSelector(selectExperiment, (state) => state.collection);
export const selectExperimentsListData = createSelector(selectExperiment, (state) => state.collection?.data);
export const selectExperimentsSimpleList = createSelector(selectExperiment, (state) => state.list);
export const selectExperimentsPagination = createSelector(selectExperiment, (state) => state.pagination);
export const selectExperimentsPaginationMeta = createSelector(selectExperiment, (state) => state.collection?.meta);
export const selectExperimentsPaginationLinks = createSelector(selectExperiment, (state) => state.collection?.links);
export const selectCurrentExperiment = createSelector(selectExperiment, (state) => state?.current || null);
export const selectCurrentPage = createSelector(selectExperimentsList, (state) => state.meta?.current_page || 1);
export const selectTotalRecords = createSelector(selectExperimentsList, (state) => state.meta?.total || 0);
export const selectPageRequested = createSelector(selectExperiment, (state) => state.pageRequested || 1);
export const selectIsLoading = createSelector(selectExperiment, (state) => state.isLoading);
export const selectExperimentCreateFormValues = createSelector(selectExperiment, (state) => state.form);
export const selectExperimentFormValid = createSelector(
  selectExperimentCreateFormValues,
  (form) => form?.valid || false
);
