import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProxyState } from './proxy.reducer';

export const selectProxy = createFeatureSelector<ProxyState>('proxy');
export const selectProxiesList = createSelector(selectProxy, (state) => state.collection);
export const selectProxiesListData = createSelector(selectProxy, (state) => state?.collection?.data);
export const selectProxiesSimpleList = createSelector(selectProxy, (state) => state.list);
export const selectProxiesPagination = createSelector(selectProxy, (state) => state.pagination);
export const selectProxiesPaginationMeta = createSelector(selectProxy, (state) => state.collection?.meta);
export const selectProxiesPaginationLinks = createSelector(selectProxy, (state) => state.collection?.links);
export const selectCurrentProxy = createSelector(selectProxy, (state) => state?.current || null);
export const selectCurrentPage = createSelector(selectProxiesList, (state) => state.meta?.current_page || 1);
export const selectTotalRecords = createSelector(selectProxiesList, (state) => state.meta?.total || 0);
export const selectPageRequested = createSelector(selectProxy, (state) => state.pageRequested || 1);
export const selectIsLoading = createSelector(selectProxy, (state) => state.isLoading);
export const selectProxyCreateFormValues = createSelector(selectProxy, (state) => state?.form);
