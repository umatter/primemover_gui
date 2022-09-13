import { Action, createReducer, on } from '@ngrx/store';
import {
  crawlerPageRequested,
  crawlerRequested,
  crawlerResetRequested,
  crawlersRetrieved,
  currentCrawlerResetRequested, experimentsRetrieved, proxiesRetrieved, updateCrawlerCreateValues
} from './crawler.actions';
import { DataCollection } from '../../shared/model/data-collection';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Crawler } from '../model/crawler';
import { CrawlerFormValues } from '../model/crawler-form-values';
import { updateExperimentCreateValues } from '../../experiment/store/experiment.actions';

export interface CrawlerState {
  collection: DataCollection;
  proxy: DataCollection;
  pagination: PaginatePipeArgs;
  current: Crawler | null;
  isLoading: boolean;
  pageRequested: number;
  form?: CrawlerFormValues
}

export const initialState: CrawlerState = {
  collection: { data: [], links: null, meta: null },
  proxy: { data: [], links: null, meta: null },
  pagination: { id: 'crawlers', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  current: null,
  isLoading: false,
  pageRequested: 0
};

const reducer = createReducer(
  initialState,
  on(crawlerResetRequested, () => initialState),
  on(crawlerPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(currentCrawlerResetRequested, (state) => ({ ...state, current: null })),
  on(updateCrawlerCreateValues, (state, action) => ({ ...state, form: action })),
  on(crawlerRequested, (state, action) => ({ ...state, current: action, isLoading: true })),
  on(crawlersRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'crawlers',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  })),


  on(experimentsRetrieved, (state, action) => ({ ...state, collection: action.collection })),
  on(proxiesRetrieved, (state, action) => ({ ...state, proxy: action.proxy })),


);

export function crawlerReducer(state: CrawlerState | undefined, action: Action): any {
  return reducer(state, action);
}
