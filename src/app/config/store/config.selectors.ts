import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigurationState } from './config.reducer';

export const selectConfiguration = createFeatureSelector<ConfigurationState>('config');
export const selectConfigurationsList = createSelector(selectConfiguration, (state) => state.collection);
export const selectConfigurationsListData = createSelector(selectConfiguration, (state) => state.collection?.data);
export const selectConfigurationsSimpleList = createSelector(selectConfiguration, (state) => state.list);
export const selectConfigurationsPagination = createSelector(selectConfiguration, (state) => state.pagination);
export const selectConfigurationsPaginationMeta = createSelector(selectConfiguration, (state) => state.collection?.meta);
export const selectConfigurationsPaginationLinks = createSelector(selectConfiguration, (state) => state.collection?.links);
export const selectCurrentConfiguration = createSelector(selectConfiguration, (state) => state?.current || null);
export const selectCurrentPage = createSelector(selectConfigurationsList, (state) => state.meta?.current_page || 1);
export const selectTotalRecords = createSelector(selectConfigurationsList, (state) => state.meta?.total || 0);
export const selectPageRequested = createSelector(selectConfiguration, (state) => state.pageRequested || 1);
export const selectIsLoading = createSelector(selectConfiguration, (state) => state.isLoading);
export const selectConfigurationCreateFormValues = createSelector(selectConfiguration, (state) => state.form);
export const selectConfigurationFormValid = createSelector(
  selectConfigurationCreateFormValues,
  (form) => form?.valid || false
);
