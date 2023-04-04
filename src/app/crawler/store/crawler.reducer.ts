import { Action, createReducer, on } from '@ngrx/store';
import {
  crawlerPageRequested,
  crawlerRequested,
  crawlerResetRequested,
  currentCrawlerResetRequested,
  updateCrawlerCreateValues
} from './crawler.actions';
import { PaginatePipeArgs } from 'ngx-pagination';
import { CrawlerFormValues } from '../model/crawler-form-values';

export interface CrawlerState {
  pagination: PaginatePipeArgs;
  isLoading: boolean;
  pageRequested: number;
  form?: CrawlerFormValues;
}

export const initialState: CrawlerState = {
  pagination: { id: 'crawlers', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  pageRequested: 0
};

const reducer = createReducer(
  initialState,
  on(crawlerResetRequested, () => initialState),
  on(crawlerPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(currentCrawlerResetRequested, (state) => ({ ...state, current: null })),
  on(updateCrawlerCreateValues, (state, action) => ({ ...state, form: action })),
  on(crawlerRequested, (state, action) => ({ ...state, current: action, isLoading: true }))
);

export function crawlerReducer(state: CrawlerState | undefined, action: Action): any {
  return reducer(state, action);
}
