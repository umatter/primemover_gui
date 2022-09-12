import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentRoutingModule } from './agent-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { agentReducer } from './store/agent.reducer';
import { AgentEffects } from './store/agent.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { queueReducer } from '../queue/store/queue.reducer';
import { AgentComponent } from './component/agent/agent.component';
import { AgentCreateComponent } from './component/agent-create/agent-create.component';
import { experimentReducer } from '../experiment/store/experiment.reducer';

@NgModule({
  declarations: [AgentComponent, AgentCreateComponent],
  imports: [
    CommonModule,
    AgentRoutingModule,
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('queue', queueReducer),
    StoreModule.forFeature('agent', agentReducer),

    EffectsModule.forFeature([AgentEffects]),
    NgxPaginationModule,
    SharedModule
  ]
})
export class AgentModule { }
