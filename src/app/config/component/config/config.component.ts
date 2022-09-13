import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import {
  configurationDeleteRequested,
  configurationPageRequested,
  configurationRequested
} from '../../store/config.actions';
import {
  selectConfigurationsListData,
  selectConfigurationsPagination,
  selectIsLoading
} from '../../store/config.selectors';
import { Configuration } from '../../model/config';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  animations: [fadeIn]
})
export class ConfigComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  configurationsData$: Observable<any>;
  isLoading$: Observable<boolean>;

  constructor(private store: Store, public router: Router) { }

  ngOnInit(): void {
    this.configurationsData$ = this.store.pipe(select(selectConfigurationsListData));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(configurationPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectConfigurationsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectConfiguration(configuration: Configuration): void {
    this.store.dispatch(configurationRequested({ configuration: configuration }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteConfiguration(configurationId: number): void {
    this.store.dispatch(configurationDeleteRequested({ configurationId }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
