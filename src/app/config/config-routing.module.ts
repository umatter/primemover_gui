import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { ConfigComponent } from './index/config.component';
import { ConfigCreateComponent } from './create/config-create.component';

export const configRoutes: Routes = [
  {
    path: '',
    component: ConfigComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: ConfigCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(configRoutes)],
  exports: [RouterModule]
})
export class ConfigurationRoutingModule {}
