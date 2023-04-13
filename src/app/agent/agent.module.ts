import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentRoutingModule } from './agent-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { AgentComponent } from './index/agent.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AgentFormComponent } from './form/agent-form.component';

@NgModule({
  declarations: [AgentComponent, AgentFormComponent],
  exports: [AgentFormComponent],
  imports: [CommonModule, AgentRoutingModule, NgxPaginationModule, SharedModule, MatProgressSpinnerModule]
})
export class AgentModule {}
