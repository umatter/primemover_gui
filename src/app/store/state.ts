import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';

export interface AppState {
  router: RouterReducerState<any>;
}

export const reducer: ActionReducerMap<AppState> = {
  router: routerReducer
};

export const metaReducer: MetaReducer<AppState>[] = [];
