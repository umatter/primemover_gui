import { Action, createReducer, on } from '@ngrx/store';
import {
  currentProxyResetRequested,
  proxiesSimpleListRetrieved,
  proxyPageRequested,
  proxyRequested,
  proxyResetRequested,
  updateProxyCreateValues
} from './proxy.actions';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Proxy } from '@app/proxy/model/proxy';

export interface ProxyState {
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  form?: Proxy;
  list?: [];
}

export const initialState: ProxyState = {
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false
};

const reducer = createReducer(
  initialState,
  on(proxyResetRequested, () => initialState),
  on(currentProxyResetRequested, (state) => ({ ...state, current: null })),
  on(proxyRequested, (state, action) => ({ ...state, current: action.proxy, isLoading: true })),
  on(proxyPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateProxyCreateValues, (state, action) => ({ ...state, form: action })),
  on(proxiesSimpleListRetrieved, (state, action) => ({ ...state, list: action.list }))
);

export function proxyReducer(state: ProxyState | undefined, action: Action): any {
  return reducer(state, action);
}
