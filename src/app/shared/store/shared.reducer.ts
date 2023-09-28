import { createFeature, createReducer, on } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { QueryFilterType } from '@shared/store/shared.selectors';
import { Job } from '@app/job/model/Job';
import { SharedActions } from '@shared/store/shared.actions';

export interface SharedState {
  queryFilter: QueryFilter[];
  currentExperiment: Experiment | null;
  currentCrawler: Crawler | null;
  currentQueue: Queue | null;
  currentJob: Job | null;
  pageRequested: number;
  isUploading: boolean;
  uploadError: any;
  error: object;
  isDownloading: boolean;
  downloadError: any;
  downloadSuccess: any;
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
  isUploading: false,
  uploadError: null,
  isDownloading: false,
  downloadError: null,
  downloadSuccess: null
};
export const sharedFeature = createFeature({
  name: 'shared',
  reducer: createReducer(
    initialState,
    on(SharedActions.init, (): SharedState => ({ ...initialState })),
    on(SharedActions.errorRequested, (state, action): SharedState => ({ ...initialState, error: action.error })),
    on(SharedActions.errorResetRequested, (state) => ({ ...state, error: null })),
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
    on(SharedActions.uploadFileFailure, (state, action) => {
      return {
        ...state,
        isUploading: false,
        uploadError: action.error
      };
    }),

    on(SharedActions.uploadFile, (state) => {
      return { ...state, isUploading: true, uploadError: null };
    }),
    on(SharedActions.uploadFileSuccess, (state) => {
      return { ...state, isUploading: false, uploadError: null };
    }),
    on(SharedActions.downloadFile, (state) => ({ ...state, isDownloading: true })),
    on(SharedActions.downloadFileSuccess, (state, action) => ({
      ...state,
      isDownloading: false,
      downloadSuccess: action.response
    })),
    on(SharedActions.downloadFileFailure, (state, action) => ({
      ...state,
      isDownloading: false,
      downloadError: action.error
    }))
  )
});

export const {
  name,
  reducer: sharedReducer,
  selectSharedState,
  selectQueryFilter,
  selectCurrentExperiment,
  selectCurrentCrawler,
  selectCurrentQueue,
  selectCurrentJob,
  selectPageRequested,
  selectIsUploading,
  selectUploadError,
  selectIsDownloading,
  selectDownloadError,
  selectDownloadSuccess
} = sharedFeature;
