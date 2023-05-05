import {
  invalidLocalStorageTokenFound,
  logoutRequested,
  noLocalStorageTokenFound,
  signInCompleted,
  signInFailed,
  updateUserRequested,
  User,
  useTokenFromLocalStorageRequested
} from './auth.actions';
import { Action, createReducer, on } from '@ngrx/store';

export interface AuthState {
  token?: string | null;
  user?: User | null;
  response?: any;
}

export const initialState: AuthState = {
  token: null,
  user: null
};

const reducer = createReducer(
  initialState,
  on(updateUserRequested, (state, action) => ({ ...state, user: action.user })),
  on(useTokenFromLocalStorageRequested, (state, action) => ({ ...state, token: action.token })),
  on(noLocalStorageTokenFound, (state) => ({ ...state, token: null })),
  on(invalidLocalStorageTokenFound, (state) => ({ ...state, token: null })),
  on(signInCompleted, (state, action) => ({ ...state, token: action.token })),
  on(logoutRequested, (state) => ({ ...state, token: null })),
  on(signInFailed, (state, action) => ({ ...state, response: action.error }))
);

export function authReducer(state: AuthState | undefined, action: Action): any {
  return reducer(state, action);
}
