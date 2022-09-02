import { Action, createReducer, on } from '@ngrx/store';
import {
  currentExperimentResetRequested,
  experimentPageRequested,
  experimentRequested,
  experimentResetRequested,
  experimentsRetrieved, experimentsSimpleListRetrieved,
  updateExperimentCreateValues
} from './experiment.actions';
import { DataCollection } from '../../shared/model/data-collection';
import { Experiment } from '../model/experiment';
import { PaginatePipeArgs } from 'ngx-pagination';
import { ExperimentFormValues } from '../component/model/experiment-form-values';

export interface ExperimentState {
  collection: DataCollection;
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  current: Experiment | null;
  form?: ExperimentFormValues;
  list?: []
}

export const initialState: ExperimentState = {
  collection: { data: [], links: null, meta: null },
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  current: null
};

const reducer = createReducer(
  initialState,
  on(experimentResetRequested, () => initialState),
  on(currentExperimentResetRequested, (state) => ({ ...state, current: null })),
  on(experimentRequested, (state, action) => ({ ...state, current: action.experiment, isLoading: true })),
  on(experimentPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateExperimentCreateValues, (state, action) => ({ ...state, form: action })),
  on(experimentsSimpleListRetrieved, (state, action) => ({ ...state, list: action.list })),
  on(experimentsRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'experiments',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  }))
);

export function experimentReducer(state: ExperimentState | undefined, action: Action): any {
  return reducer(state, action);
}
