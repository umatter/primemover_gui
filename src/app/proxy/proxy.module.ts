import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProxyRoutingModule } from './proxy-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ProxyComponent } from './index/proxy.component';
import { ProxyFormComponent } from './form/proxy-form.component';

@NgModule({
  declarations: [ProxyComponent, ProxyFormComponent],
  exports: [ProxyFormComponent],
  imports: [CommonModule, ProxyRoutingModule, NgxPaginationModule, SharedModule]
})
export class ProxyModule {}
