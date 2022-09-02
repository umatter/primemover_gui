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
  { path: 'config', loadChildren: () => import('./config/config.module').then((m) => m.ConfigModule) },
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
