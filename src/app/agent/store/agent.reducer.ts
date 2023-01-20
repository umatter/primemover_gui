import { Action, createReducer, on } from '@ngrx/store';
import {
  currentAgentResetRequested,
  agentPageRequested,
  agentRequested,
  agentResetRequested,
  agentsRetrieved,
  agentsSimpleListRetrieved,
  updateAgentCreateValues,
  getAgetList
} from './agent.actions';
import { DataCollection } from '../../shared/model/data-collection';
import { Agent } from '../model/agent';
import { PaginatePipeArgs } from 'ngx-pagination';
import { AgentFormValues } from '../component/model/agent-form-values';

export interface AgentState {
  collection: DataCollection;
  data: any;
  pagination: PaginatePipeArgs;
  pageRequested: number;
  isLoading: boolean;
  current: Agent | null;
  form?: AgentFormValues;
  list?: [];
}

export const initialState: AgentState = {
  data: null,

  collection: { data: [], links: null, meta: null },
  pageRequested: 0,
  pagination: { id: '', itemsPerPage: 10, currentPage: 1, totalItems: 0 },
  isLoading: false,
  current: null
};

const reducer = createReducer(
  initialState,
  on(agentResetRequested, () => initialState),
  on(currentAgentResetRequested, (state) => ({ ...state, current: null })),
  on(agentRequested, (state, action) => ({ ...state, current: action.agent, isLoading: true })),
  on(agentPageRequested, (state, action) => ({ ...state, pageRequested: action.page, isLoading: true })),
  on(updateAgentCreateValues, (state, action) => ({ ...state, form: action })),
  on(agentsSimpleListRetrieved, (state, action) => ({ ...state, list: action.list })),
  on(agentsRetrieved, (state, action) => ({
    ...state,
    isLoading: false,
    collection: action.collection,
    pagination: {
      id: 'agents',
      itemsPerPage: action.collection.meta?.per_page,
      currentPage: action.collection.meta?.current_page,
      totalItems: action.collection.meta?.total
    }
  })),
  on(getAgetList, (state, action) => ({ ...state }))
);

export function agentReducer(state: AgentState | undefined, action: Action): any {
  return reducer(state, action);
}
