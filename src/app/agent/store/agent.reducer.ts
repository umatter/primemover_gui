import { Action, createReducer, on } from '@ngrx/store';
import {
  agentPageRequested,
  agentRequested,
  agentResetRequested,
  agentsSimpleListRetrieved,
  currentAgentResetRequested,
  updateAgentCreateValues
} from './agent.actions';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Agent } from '@app/agent/model/agent';

export interface AgentState {
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  form?: Agent;
  list?: [];
}

export const initialState: AgentState = {
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false
};

const reducer = createReducer(
  initialState,
  on(agentResetRequested, () => initialState),
  on(currentAgentResetRequested, (state) => ({ ...state, current: null })),
  on(agentRequested, (state, action) => ({ ...state, current: action.agent, isLoading: true })),
  on(agentPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateAgentCreateValues, (state, action) => ({ ...state, form: action })),
  on(agentsSimpleListRetrieved, (state, action) => ({ ...state, list: action.list }))
);

export function agentReducer(state: AgentState | undefined, action: Action): any {
  return reducer(state, action);
}
