import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { PaginatePipeArgs } from 'ngx-pagination';
import { fadeIn } from '@shared/animation/trigger';
import { Crawler } from '../model/crawler';
import { CrawlerService } from '@app/entity/service';
import { CrawlerApiService } from '@app/crawler/service/crawler-api.service';
import { QueryFilter } from '@shared/model/query-filter';
import { QueryFilterType, selectCurrentCrawler } from '@shared/store/shared.selectors';
import { Meta } from '@shared/pagination/model';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-crawler',
  templateUrl: './crawler.component.html',
  animations: [fadeIn]
})
export class CrawlerComponent implements OnDestroy {
  isLoading$: Observable<boolean>;
  paginationConfig: PaginatePipeArgs;
  entities$: Observable<Crawler[] | any>;
  entityToDelete: Crawler | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentCrawler$: Observable<Crawler>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(private store: Store, private entityService: CrawlerService, private apiService: CrawlerApiService) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentCrawler$ = this.store.select(selectCurrentCrawler);
    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(SharedActions.requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  selectCrawler(crawler: Crawler): void {
    this.store.dispatch(SharedActions.crawlerSelection({ crawler }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  deleteRequest(crawler: Crawler): void {
    this.entityToDelete = crawler;
  }

  onModalResponse(event: boolean): void {
    if (event && this.entityToDelete) {
      this.subscriptions.add(
        this.entityService
          .delete(this.entityToDelete.id)
          .pipe()
          .subscribe(() => {
            this.store.dispatch(SharedActions.crawlerSelection({ crawler: null }));
            this.store.dispatch(SharedActions.resetQueryFilterRequested({ filterName: QueryFilterType.Crawler }));
            this.entityToDelete = null;
          })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.entityService.clearCache();
  }
}
