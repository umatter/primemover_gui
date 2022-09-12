import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AgentState } from './agent.reducer';

export const selectAgent = createFeatureSelector<AgentState>('agent');
export const selectAgentsList = createSelector(selectAgent, (state) => state?.collection);
export const selectAgentsListData = createSelector(selectAgent, (state) => state?.collection?.data);
export const selectAgentsSimpleList = createSelector(selectAgent, (state) => state.list);
export const selectAgentsPagination = createSelector(selectAgent, (state) => state?.pagination);
export const selectAgentsPaginationMeta = createSelector(selectAgent, (state) => state?.collection?.meta);
export const selectAgentsPaginationLinks = createSelector(selectAgent, (state) => state?.collection?.links);
export const selectCurrentAgent = createSelector(selectAgent, (state) => state?.current || null);
export const selectCurrentPage = createSelector(selectAgentsList, (state) => state.meta?.current_page || 1);
export const selectTotalRecords = createSelector(selectAgentsList, (state) => state.meta?.total || 0);
export const selectPageRequested = createSelector(selectAgent, (state) => state.pageRequested || 1);
export const selectIsLoading = createSelector(selectAgent, (state) => state.isLoading);
export const selectAgentCreateFormValues = createSelector(selectAgent, (state) => state.form);


export const agentsList = createSelector(selectAgent, (state) => state.collection);

export const selectAgentFormValid = createSelector(
    selectAgentCreateFormValues,
    (form) => form?.valid || false
);
