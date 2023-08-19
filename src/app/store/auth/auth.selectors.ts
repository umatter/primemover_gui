import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuth = createFeatureSelector<AuthState>('auth');
export const selectAccessToken = createSelector(selectAuth, (state) => state.token);
export const selectIsSignedIn = createSelector(selectAuth, (state) => {
  return Boolean(state.token);
});
export const selectUser = createSelector(selectAuth, (state) => state.user);
export const selectCurrentUser = createSelector(selectAuth, (state) => state.user);
export const selectErrorResponse = createSelector(selectAuth, (state) => state.response || null);
