import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationRoutingModule } from './config-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { configReducer } from './store/config.reducer';
import { ConfigEffects } from './store/config.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ConfigComponent } from './index/config.component';
import { ConfigFormComponent } from './form/config-form.component';

@NgModule({
  declarations: [ConfigComponent, ConfigFormComponent],
  exports: [ConfigFormComponent],
  imports: [
    CommonModule,
    ConfigurationRoutingModule,
    StoreModule.forFeature('config', configReducer),
    EffectsModule.forFeature([ConfigEffects]),

    NgxPaginationModule,
    SharedModule
  ]
})
export class ConfigurationModule {}
