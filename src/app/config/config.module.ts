import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigurationRoutingModule } from './config-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ConfigComponent } from './index/config.component';
import { ConfigFormComponent } from './form/config-form.component';

@NgModule({
  declarations: [ConfigComponent, ConfigFormComponent],
  exports: [ConfigFormComponent],
  imports: [CommonModule, ConfigurationRoutingModule, NgxPaginationModule, SharedModule]
})
export class ConfigurationModule {}
