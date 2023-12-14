import { createFeature, createReducer, on } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Job } from '@app/job/model/Job';
import { SharedActions } from '@shared/store/shared.actions';
import { TimezoneDetail } from '@shared/service/timezone.service';
import { HttpResponseBase } from '@angular/common/http';

export interface SharedState {
  queryFilter: QueryFilter[];
  currentExperiment: Experiment | null;
  currentCrawler: Crawler | null;
  currentQueue: Queue | null;
  currentJob: Job | null;
  pageRequested: number;
  error: HttpResponseBase | null;
  downloadSuccess: any;
  timezoneList: string[];
  timezoneLoading: boolean;
  timezoneDetail: TimezoneDetail;
  isLoading: boolean;
}

export const initialState: SharedState = {
  error: null,
  currentJob: null,
  currentQueue: null,
  currentCrawler: null,
  currentExperiment: null,
  pageRequested: 1,
  queryFilter: [
    {
      name: QueryFilterType.Recent,
      value: 30
    }
  ],
  downloadSuccess: null,
  timezoneList: [],
  timezoneLoading: false,
  timezoneDetail: null,
  isLoading: false
};
export const sharedFeature = createFeature({
  name: 'shared',
  reducer: createReducer(
    initialState,
    on(SharedActions.init, (): SharedState => ({ ...initialState })),
    on(SharedActions.errorRequested, (state, action): SharedState => ({ ...initialState, error: action.error })),
    on(SharedActions.errorResetRequested, (state) => ({ ...state, error: null, isLoading: false })),
    on(SharedActions.clearQueryFilterRequested, (state) => ({ ...state, queryFilter: [] })),
    on(SharedActions.updateQueryFilter, (state, action) => ({ ...state, queryFilter: action.updatedFilter })),
    on(SharedActions.requestPage, (state, action) => ({ ...state, pageRequested: action.page })),
    on(SharedActions.crawlerSelection, (state, action) => ({
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
    on(SharedActions.experimentSelection, (state, action) => ({
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
    on(SharedActions.queueSelection, (state, action) => ({
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
    on(SharedActions.jobSelection, (state, action) => ({
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
    })),
    on(SharedActions.uploadExperimentFailure, (state, action) => {
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    }),

    on(SharedActions.uploadExperimentRequested, (state) => {
      return { ...state, isLoading: true, error: null };
    }),
    on(SharedActions.uploadExperimentSuccess, (state) => {
      return { ...state, isLoading: false, error: null };
    }),
    on(SharedActions.uploadCrawlerFailure, (state, action) => {
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    }),

    on(SharedActions.uploadCrawlerRequested, (state) => {
      return { ...state, isLoading: true, error: null };
    }),
    on(SharedActions.uploadCrawlerSuccess, (state) => {
      return { ...state, isLoading: false, error: null };
    }),
    on(SharedActions.downloadFile, (state) => ({ ...state, isLoading: true })),
    on(SharedActions.apiFailure, SharedActions.downloadFileFailure, (state, action) => ({
      ...state,
      error: action.error,
      isLoading: false
    })),
    on(SharedActions.clientFailure, (state, action) => ({
      ...state,
      error: action.error,
      isLoading: false
    })),
    on(SharedActions.emptyFailure, (state, action) => ({
      ...state,
      error: null,
      isLoading: false
    })),
    on(SharedActions.timezoneListRequested, (state) => ({
      ...state,
      timezoneLoading: true
    })),
    on(SharedActions.timezoneListSuccess, (state, action) => ({
      ...state,
      timezoneLoading: false,
      timezoneList: action.response
    })),
    on(SharedActions.timezoneListError, (state) => ({
      ...state,
      timezoneList: [],
      timezoneLoading: false
    })),
    on(SharedActions.timezoneDetailRequested, (state) => ({
      ...state,
      timezoneLoading: true
    })),
    on(SharedActions.timezoneDetailSuccess, (state, action) => ({
      ...state,
      timezoneLoading: false,
      timezoneDetail: action.detail
    })),
    on(SharedActions.timezoneDetailError, (state) => ({
      ...state,
      timezoneLoading: false,
      timezoneDetail: null
    })),
    on(SharedActions.timezoneResetRequested, (state) => ({
      ...state,
      timezoneLoading: false,
      timezoneDetail: null,
      timezoneList: null
    })),
    on(SharedActions.downloadExperimentData, (state) => ({
      ...state,
      isLoading: true
    })),

    on(
      SharedActions.downloadExperimentDataSuccess,
      SharedActions.downloadExperimentDataDone,
      SharedActions.loadingDone,
      SharedActions.downloadExperimentDataFailure,
      SharedActions.downloadFileSuccess,
      (state) => ({
        ...state,
        isLoading: false
      })
    )
  )
});

export const {
  name,
  reducer: sharedReducer,
  selectQueryFilter,
  selectCurrentCrawler,
  selectPageRequested,
  selectDownloadSuccess,
  selectTimezoneList,
  selectTimezoneLoading,
  selectTimezoneDetail,
  selectError,
  selectIsLoading
} = sharedFeature;
