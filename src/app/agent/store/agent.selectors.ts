import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AgentState } from './agent.reducer';

export const selectAgent = createFeatureSelector<AgentState>('agent');
export const selectAgentsPagination = createSelector(selectAgent, (state) => state?.pagination);
export const selectPageRequested = createSelector(selectAgent, (state) => state.pageRequested || 1);
export const selectAgentFormValues = createSelector(selectAgent, (state) => state.form);
