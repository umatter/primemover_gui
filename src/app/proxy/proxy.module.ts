import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProxyRoutingModule } from './proxy-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ProxyComponent } from './index/proxy.component';
import { ProxyFormComponent } from './form/proxy-form.component';
import { ProxyEditComponent } from '@app/proxy/edit/proxy-edit.component';
import { AgentModule } from '@app/agent/agent.module';

@NgModule({
  declarations: [ProxyComponent, ProxyFormComponent, ProxyEditComponent],
  exports: [ProxyFormComponent],
  imports: [CommonModule, ProxyRoutingModule, NgxPaginationModule, SharedModule, AgentModule]
})
export class ProxyModule {}
