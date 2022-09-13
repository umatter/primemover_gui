import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CrawlerState } from './crawler.reducer';

export const selectCrawler = createFeatureSelector<CrawlerState>('crawler');
export const selectCrawlersList = createSelector(selectCrawler, (state) => state.collection);
export const selectCrawlersListData = createSelector(selectCrawler, (state) => state.collection.data);
export const selectCrawlersPagination = createSelector(selectCrawler, (state) => state.pagination);
export const selectCurrentPage = createSelector(selectCrawlersList, (state) => state.meta?.current_page || 1);
export const selectPageRequested = createSelector(selectCrawler, (state) => state.pageRequested || 1);
export const selectCurrentCrawler = createSelector(selectCrawler, (state) => state?.current || null);
export const selectIsLoading = createSelector(selectCrawler, (state) => state.isLoading);
export const selectCrawlerCreateFormValues = createSelector(selectCrawler, (state) => state.form);


export const selectCrawlerFormValid = createSelector(
  selectCrawlerCreateFormValues,
  (form) => form?.valid || false
);
