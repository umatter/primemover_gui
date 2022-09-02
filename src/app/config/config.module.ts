import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConfigRoutingModule } from './config-routing.module';
import { ConfigComponent } from './component/config.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ConfigEffects } from './store/config.effects';
import * as fromConfig from './store/config.reducer';
@NgModule({
  declarations: [ConfigComponent],
  imports: [
    CommonModule,
    ConfigRoutingModule,
    StoreModule.forFeature('config', fromConfig.configReducer),
    EffectsModule.forRoot([ConfigEffects])
  ]
})
export class ConfigModule {}
