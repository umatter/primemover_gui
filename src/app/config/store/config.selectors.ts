import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ConfigState } from './config.reducer';

export const selectConfig = createFeatureSelector<ConfigState>('config');

export const selectAppConfig = createSelector(selectConfig, (state) => state.appConfig);
