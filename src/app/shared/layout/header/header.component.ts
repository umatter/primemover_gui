import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { fadeIn } from '../../animation/trigger';
import { resetQueryFilterRequested } from '../../store/shared.actions';
import { QueryFilterType, selectQueryFilter } from '../../store/shared.selectors';
import { QueryFilter } from '../../model/query-filter';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  animations: [fadeIn]
})
export class HeaderComponent {
  queryFilter$: Observable<QueryFilter[]>;

  constructor(private store: Store) {
    this.queryFilter$ = this.store.select(selectQueryFilter);
  }

  resetQueryFilter(filterName: QueryFilterType): void {
    this.store.dispatch(resetQueryFilterRequested({ filterName: filterName }));
  }
}
