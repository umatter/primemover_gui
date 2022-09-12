import { Action, createReducer, on } from '@ngrx/store';
import {
  currentProxyResetRequested,
  proxyPageRequested,
  proxyRequested,
  proxyResetRequested,
  proxiesRetrieved, proxiesSimpleListRetrieved,
  updateProxyCreateValues
} from './proxy.actions';
import { DataCollection } from '../../shared/model/data-collection';
import { Proxy } from '../model/proxy';
import { PaginatePipeArgs } from 'ngx-pagination';
import { ProxyFormValues } from '../component/model/proxy-form-values';

export interface ProxyState {
  collection: DataCollection;
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  current: Proxy | null;
  form?: ProxyFormValues;
  list?: []
}

export const initialState: ProxyState = {
  collection: { data: [], links: null, meta: null },
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  current: null
};

const reducer = createReducer(
  initialState,
  on(proxyResetRequested, () => initialState),
  on(currentProxyResetRequested, (state) => ({ ...state, current: null })),
  on(proxyRequested, (state, action) => ({ ...state, current: action.proxy, isLoading: true })),
  on(proxyPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateProxyCreateValues, (state, action) => ({ ...state, form: action })),
  on(proxiesSimpleListRetrieved, (state, action) => ({ ...state, list: action.list })),
  on(proxiesRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'proxies',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  }))
);

export function proxyReducer(state: ProxyState | undefined, action: Action): any {
  return reducer(state, action);
}
