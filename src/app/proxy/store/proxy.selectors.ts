import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProxyState } from './proxy.reducer';

export const selectProxy = createFeatureSelector<ProxyState>('proxy');
export const selectProxiesPagination = createSelector(selectProxy, (state) => state.pagination);
export const selectPageRequested = createSelector(selectProxy, (state) => state.pageRequested || 1);
