import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './core/auth/login/login.component';
import { HomeComponent } from './home/component/home.component';
import { LogoutComponent } from './core/auth/logout/logout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'logout',
    component: LogoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'crawlers',
    loadChildren: () => import('./crawler/crawler.module').then((m) => m.CrawlerModule)
  },
  {
    path: 'experiments',
    loadChildren: () => import('./experiment/experiment.module').then((m) => m.ExperimentModule)
  },
  {
    path: 'queues',
    loadChildren: () => import('./queue/queue.module').then((m) => m.QueueModule)
  },
  {
    path: 'jobs',
    loadChildren: () => import('./job/job.module').then((m) => m.JobModule)
  },
  {
    path: 'agents',
    loadChildren: () => import('./agent/agent.module').then((m) => m.AgentModule)
  },
  { path: 'configurations', loadChildren: () => import('./config/config.module').then((m) => m.ConfigurationModule) },
  { path: 'proxies', loadChildren: () => import('./proxy/proxy.module').then((m) => m.ProxyModule) },
  {
    path: '**',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
