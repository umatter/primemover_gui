import { Action, createReducer, on } from '@ngrx/store';
import {
  configurationPageRequested,
  configurationRequested,
  configurationResetRequested,
  configurationsRetrieved,
  configurationsSimpleListRetrieved,
  currentConfigurationResetRequested,
  updateConfigurationCreateValues
} from './config.actions';
import { DataCollection } from '@shared/model/data-collection';
import { Configuration } from '../model/config';
import { PaginatePipeArgs } from 'ngx-pagination';

export interface ConfigurationState {
  collection: DataCollection;
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  current: Configuration | null;
  form?: Configuration;
  list?: [];
}

export const initialState: ConfigurationState = {
  collection: { data: [], links: null, meta: null },
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  current: null
};

const reducer = createReducer(
  initialState,
  on(configurationResetRequested, () => initialState),
  on(currentConfigurationResetRequested, (state) => ({ ...state, current: null })),
  on(configurationRequested, (state, action) => ({ ...state, current: action.configuration, isLoading: true })),
  on(configurationPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateConfigurationCreateValues, (state, action) => ({ ...state, form: action })),
  on(configurationsSimpleListRetrieved, (state, action) => ({ ...state, list: action.list })),
  on(configurationsRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'configurations',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  }))
);

export function configReducer(state: ConfigurationState | undefined, action: Action): any {
  return reducer(state, action);
}
