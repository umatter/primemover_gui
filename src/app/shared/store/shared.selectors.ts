import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SharedState } from './shared.reducer';

export enum QueryFilterType {
  Crawler = 'crawler',
  Experiment = 'experiment',
  Queue = 'queue',
  Job = 'job',
  Recent = 'recent'
}

export const selectShared = createFeatureSelector<SharedState>('shared');
export const selectCurrentCrawler = createSelector(selectShared, (state) => {
  return (
    state.queryFilter.filter((item) => item.entity && item.name === QueryFilterType.Crawler).shift()?.entity || null
  );
});
export const selectCurrentExperiment = createSelector(selectShared, (state) => {
  return (
    state.queryFilter.filter((item) => item.entity && item.name === QueryFilterType.Experiment).shift()?.entity || null
  );
});
export const selectCurrentQueue = createSelector(selectShared, (state) => {
  return state.queryFilter.filter((item) => item.entity && item.name === QueryFilterType.Queue).shift()?.entity || null;
});

export const selectCurrentJob = createSelector(selectShared, (state) => {
  return state.queryFilter.filter((item) => item.entity && item.name === QueryFilterType.Job).shift()?.entity || null;
});

export const selectRecentFilter = createSelector(selectShared, (state) => {
  return state.queryFilter.filter((item) => item.name === QueryFilterType.Recent).shift() || null;
});

export const selectFile = createSelector(selectShared, (state) => {
  return { isUploading: state.isLoading, uploadError: state.error };
});
