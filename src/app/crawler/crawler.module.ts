import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrawlerRoutingModule } from './crawler-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { crawlerReducer } from './store/crawler.reducer';
import { CrawlerEffects } from './store/crawler.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { experimentReducer } from '../experiment/store/experiment.reducer';
import { CrawlerComponent } from './component/crawler/crawler.component';
import { CrawlerCreateComponent } from './component/crawler-create/crawler-create.component';

@NgModule({
  declarations: [CrawlerComponent, CrawlerCreateComponent],
  imports: [
    CommonModule,
    CrawlerRoutingModule,
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('queue', experimentReducer),
    EffectsModule.forFeature([CrawlerEffects]),
    NgxPaginationModule,
    SharedModule
  ]
})
export class CrawlerModule {}
