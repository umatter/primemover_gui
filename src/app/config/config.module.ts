import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationRoutingModule } from './config-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { configReducer } from './store/config.reducer';
import { ConfigEffects } from './store/config.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { queueReducer } from '../queue/store/queue.reducer';
import { ConfigComponent } from './component/config/config.component';
import { ConfigCreateComponent } from './component/config-create/config-create.component';
import { experimentReducer } from '../experiment/store/experiment.reducer';

@NgModule({
  declarations: [ConfigComponent, ConfigCreateComponent],
  imports: [
    CommonModule,
    ConfigurationRoutingModule,
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('config', configReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('queue', queueReducer),
    EffectsModule.forFeature([ConfigEffects]),

    NgxPaginationModule,
    SharedModule
  ]
})
export class ConfigurationModule { }
