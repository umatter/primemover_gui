import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProxyRoutingModule } from './proxy-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { proxyReducer } from './store/proxy.reducer';
import { ProxyEffects } from './store/proxy.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { queueReducer } from '../queue/store/queue.reducer';
import { ProxyComponent } from './component/proxy/proxy.component';
import { ProxyCreateComponent } from './component/proxy-create/proxy-create.component';
import { experimentReducer } from '../experiment/store/experiment.reducer';

@NgModule({
  declarations: [ProxyComponent, ProxyCreateComponent],
  imports: [
    CommonModule,
    ProxyRoutingModule,
    StoreModule.forFeature('proxy', proxyReducer),
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('queue', queueReducer),
    EffectsModule.forFeature([ProxyEffects]),

    NgxPaginationModule,
    SharedModule
  ]
})
export class ProxyModule {}
