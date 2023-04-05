import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobRoutingModule } from './job-routing.module';
import { JobComponent } from './index/job.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { QueueModule } from '../queue/queue.module';
import { JobFormComponent } from './form/job-form.component';
import { BehaviorFormComponent } from '@app/behavior/form/behavior-form.component';
import { BehaviorComponent } from '@app/behavior/index/behavior.component';

@NgModule({
  declarations: [JobComponent, JobFormComponent, BehaviorFormComponent, BehaviorComponent],
  imports: [CommonModule, JobRoutingModule, NgxPaginationModule, SharedModule, QueueModule],
  exports: [JobComponent, JobFormComponent, BehaviorFormComponent, BehaviorComponent]
})
export class JobModule {}
