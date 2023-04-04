import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QueueComponent } from './index/queue.component';
import { QueueCreateComponent } from './create/queue-create.component';
import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: QueueComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: QueueCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QueueRoutingModule {}
