import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CrawlerState } from './crawler.reducer';

export const selectCrawler = createFeatureSelector<CrawlerState>('crawler');
export const selectCrawlersPagination = createSelector(selectCrawler, (state) => state.pagination);
export const selectPageRequested = createSelector(selectCrawler, (state) => state.pageRequested || 1);
export const selectCrawlerCreateFormValues = createSelector(selectCrawler, (state) => state.form);
