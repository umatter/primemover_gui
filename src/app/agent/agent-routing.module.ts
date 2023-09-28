import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { AgentComponent } from './index/agent.component';
import { AgentEditComponent } from '@app/agent/edit/agent-edit.component';

export const agentRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { requiresLogin: true },

    children: [
      {
        path: '',
        component: AgentComponent
      },
      {
        path: ':id/edit',
        component: AgentEditComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(agentRoutes)],
  exports: [RouterModule]
})
export class AgentRoutingModule {}
