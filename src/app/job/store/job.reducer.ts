import { Action, createReducer, on } from '@ngrx/store';
import { PaginatePipeArgs } from 'ngx-pagination';
import { jobPageRequested, jobResetRequested, jobsRetrieved } from './job.actions';

export interface JobState {
  pagination: PaginatePipeArgs;
  isLoading: boolean;
  pageRequested: number;
}

export const initialState: JobState = {
  pagination: { id: 'jobs', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  pageRequested: 0
};

const reducer = createReducer(
  initialState,
  on(jobResetRequested, () => initialState),
  on(jobPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(jobsRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'jobs',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  }))
);

export function jobReducer(state: JobState | undefined, action: Action): any {
  return reducer(state, action);
}
