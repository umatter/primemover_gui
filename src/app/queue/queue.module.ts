import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { QueueRoutingModule } from './queue-routing.module';
import { QueueComponent } from './index/queue.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { StatusComponent } from './status/status.component';
import { QueueCreateComponent } from './create/queue-create.component';

@NgModule({
  declarations: [QueueComponent, StatusComponent, QueueCreateComponent],
  exports: [StatusComponent],
  imports: [CommonModule, QueueRoutingModule, NgxPaginationModule, SharedModule],
  providers: [DatePipe]
})
export class QueueModule {}
