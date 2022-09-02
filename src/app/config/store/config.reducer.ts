import { Action, createReducer, on } from '@ngrx/store';
import { AppConfig } from '../../app-config';
import { setAppConfig } from './config.actions';

export interface ConfigState {
  appConfig: AppConfig | null;
}

export const initialState: ConfigState = {
  appConfig: null
};

const reducer = createReducer(
  initialState,
  on(setAppConfig, (state, action) => ({
    ...state,
    appConfig: action.appConfig
  }))
);

export function configReducer(state: ConfigState | undefined, action: Action): any {
  return reducer(state, action);
}
