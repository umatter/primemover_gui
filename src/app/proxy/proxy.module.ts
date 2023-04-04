import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProxyRoutingModule } from './proxy-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { proxyReducer } from './store/proxy.reducer';
import { ProxyEffects } from './store/proxy.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ProxyComponent } from './index/proxy.component';
import { ProxyFormComponent } from './form/proxy-form.component';

@NgModule({
  declarations: [ProxyComponent, ProxyFormComponent],
  exports: [ProxyFormComponent],
  imports: [
    CommonModule,
    ProxyRoutingModule,
    StoreModule.forFeature('proxy', proxyReducer),
    EffectsModule.forFeature([ProxyEffects]),

    NgxPaginationModule,
    SharedModule
  ]
})
export class ProxyModule {}
