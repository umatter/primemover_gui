import { Action, createReducer, on } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import {
  clearQueryFilterRequested,
  crawlerSelection,
  experimentSelection,
  initShared,
  jobSelection,
  queueSelection,
  requestPage,
  updateQueryFilter
} from './shared.actions';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Job } from '@app/job/model/Job';

export interface SharedState {
  queryFilter: QueryFilter[];
  currentExperiment?: Experiment | null;
  currentCrawler?: Crawler | null;
  currentQueue?: Queue | null;
  currentJob?: Job | null;
  pageRequested: number;
}

export const initialState: SharedState = {
  pageRequested: 1,
  queryFilter: [
    {
      name: QueryFilterType.Recent,
      value: 30
    }
  ]
};

const reducer = createReducer(
  initialState,
  on(initShared, () => initialState),
  on(clearQueryFilterRequested, (state) => ({ ...state, queryFilter: [] })),
  on(updateQueryFilter, (state, action) => ({ ...state, queryFilter: action.updatedFilter })),
  on(requestPage, (state, action) => ({ ...state, pageRequested: action.page })),
  on(crawlerSelection, (state, action) => ({
    ...state,
    currentCrawler: action.crawler,
    queryFilter: action.crawler
      ? [
          ...state.queryFilter.filter((filter) => filter.name !== QueryFilterType.Crawler),
          {
            name: QueryFilterType.Crawler,
            value: action.crawler.id,
            entity: action.crawler
          }
        ]
      : state.queryFilter
  })),
  on(experimentSelection, (state, action) => ({
    ...state,
    currentExperiment: action.experiment,
    queryFilter: action.experiment
      ? [
          ...state.queryFilter.filter((filter) => filter.name !== QueryFilterType.Experiment),
          {
            name: QueryFilterType.Experiment,
            value: action.experiment.id,
            entity: action.experiment
          }
        ]
      : state.queryFilter
  })),
  on(queueSelection, (state, action) => ({
    ...state,
    currentQueue: action.queue,
    queryFilter: action.queue
      ? [
          ...state.queryFilter.filter((filter) => filter.name !== QueryFilterType.Queue),
          {
            name: QueryFilterType.Queue,
            value: action.queue.id,
            entity: action.queue
          }
        ]
      : state.queryFilter
  })),
  on(jobSelection, (state, action) => ({
    ...state,
    currentJob: action.job,
    queryFilter: action.job
      ? [
          ...state.queryFilter.filter((filter) => filter.name !== QueryFilterType.Job),
          {
            name: QueryFilterType.Job,
            value: action.job.id,
            entity: action.job
          }
        ]
      : state.queryFilter
  }))
);

export function sharedReducer(state: SharedState | undefined, action: Action): any {
  return reducer(state, action);
}
