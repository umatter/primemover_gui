import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrawlerRoutingModule } from './crawler-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { crawlerReducer } from './store/crawler.reducer';
import { CrawlerEffects } from './store/crawler.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { experimentReducer } from '../experiment/store/experiment.reducer';
import { CrawlerComponent } from './component/crawler/crawler.component';
import { CrawlerCreateComponent } from './component/crawler-create/crawler-create.component';
import { ExperimentEffects } from '../experiment/store/experiment.effects';
import { ProxyEffects } from '../proxy/store/proxy.effects';
import { AgentEffects } from '../agent/store/agent.effects';
import { ConfigEffects } from '../config/store/config.effects';
import { proxyReducer } from '../proxy/store/proxy.reducer';
import { agentReducer } from '../agent/store/agent.reducer';
import { configReducer } from '../config/store/config.reducer';
@NgModule({
  declarations: [CrawlerComponent, CrawlerCreateComponent],
  imports: [
    CommonModule,
    CrawlerRoutingModule,
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('queue', experimentReducer),
    StoreModule.forFeature('proxy', proxyReducer),
    StoreModule.forFeature('agent', agentReducer),
    StoreModule.forFeature('config', configReducer),

    EffectsModule.forFeature([CrawlerEffects]),
    EffectsModule.forFeature([ExperimentEffects]),
    EffectsModule.forFeature([ProxyEffects]),
    EffectsModule.forFeature([AgentEffects]),
    EffectsModule.forFeature([ConfigEffects]),
    NgxPaginationModule,
    SharedModule,
  ]
})
export class CrawlerModule { }
