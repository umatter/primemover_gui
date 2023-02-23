import { Action, createReducer, on } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { PaginatePipeArgs } from 'ngx-pagination';
import {
  currentQueueResetRequested,
  queuePageRequested,
  queueRequested,
  queueResetRequested,
  queuesRetrieved
} from './queue.actions';
import { Queue } from '../model/queue';

export interface QueueState {
  collection: DataCollection;
  pagination: PaginatePipeArgs;
  current: Queue | null;
  isLoading: boolean;
  pageRequested: number;
}

export const initialState: QueueState = {
  collection: { data: [], links: null, meta: null },
  pagination: { id: 'queues', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  current: null,
  isLoading: false,
  pageRequested: 0
};

const reducer = createReducer(
  initialState,
  on(queueResetRequested, () => initialState),
  on(currentQueueResetRequested, (state) => ({ ...state, current: null })),
  on(queueRequested, (state, action) => ({ ...state, current: action, isLoading: false })),
  on(queuePageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(queuesRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'queues',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  }))
);

export function queueReducer(state: QueueState | undefined, action: Action): any {
  return reducer(state, action);
}
