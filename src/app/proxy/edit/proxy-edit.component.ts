import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Proxy } from '@app/proxy/model/proxy';
import { ProxyService } from '@app/entity/service';

@Component({
  selector: 'app-edit',
  templateUrl: './proxy-edit.component.html'
})
export class ProxyEditComponent implements OnDestroy, OnInit {
  proxy$: Observable<Proxy>;
  proxy: Proxy | undefined;
  subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private proxyService: ProxyService,
    private store: Store,
    private router: Router
  ) {}

  findProxy(): void {
    this.proxyService
      .getAll()
      .pipe()
      .subscribe((entities) => {
        const id: number = Number(this.route.snapshot.params['id']);
        this.proxy = entities.find((proxy) => proxy.id === id) ?? undefined;
      });
  }

  ngOnInit(): void {
    this.findProxy();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onCancel(): void {
    this.router.navigate(['/proxies']).then();
  }

  onSave(proxy: Proxy) {
    this.proxyService.update(proxy);
    this.router.navigate(['/proxies']).then();
  }
}
