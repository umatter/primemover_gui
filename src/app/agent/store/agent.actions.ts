import { createAction, props } from '@ngrx/store';
import { Agent } from '../model/agent';

export const agentsSimpleListRequested = createAction('[Agent] Simple list requested');
export const agentsRequestFailed = createAction('[Agent] Request failed', props<{ error: any }>());
export const agentsSimpleListRetrieved = createAction('[Agent] Simple list retrieved', props<{ list: any }>());
export const agentResetRequested = createAction('[Agent] Reset state requested');
export const agentSaveRequested = createAction('[Agent] Save requested');
export const currentAgentResetRequested = createAction('[Agent] Reset current requested');
export const agentPageRequested = createAction('[Agent] Page requested', props<{ page: number }>());
export const agentRequested = createAction('[Agent] Record requested', props<{ agent: Agent }>());
export const updateAgentCreateValues = createAction('[Agent] Update', props<Agent>());
