import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobComponent } from './index/job.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { JobFormComponent } from './form/job-form.component';
import { BehaviorComponent } from '@app/behavior/index/behavior.component';

const routes: Routes = [
  {
    path: '',
    component: JobComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: JobFormComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'behaviors/:id',
    component: BehaviorComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobRoutingModule {}
