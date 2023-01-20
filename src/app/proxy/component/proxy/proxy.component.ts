import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import { proxyDeleteRequested, proxyPageRequested, proxyRequested } from '../../store/proxy.actions';
import { selectProxiesListData, selectProxiesPagination, selectIsLoading } from '../../store/proxy.selectors';
import { Proxy } from '../../model/proxy';

@Component({
  selector: 'app-proxy',
  templateUrl: './proxy.component.html',
  animations: [fadeIn]
})
export class ProxyComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  proxiesData$: Observable<any>;
  isLoading$: Observable<boolean>;

  constructor(private store: Store, public router: Router) {}

  ngOnInit(): void {
    this.proxiesData$ = this.store.pipe(select(selectProxiesListData));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(proxyPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectProxiesPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectProxy(proxy: Proxy): void {
    this.store.dispatch(proxyRequested({ proxy: proxy }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteProxy(proxyId: number): void {
    this.store.dispatch(proxyDeleteRequested({ proxyId }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
