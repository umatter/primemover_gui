import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { fadeIn } from '../../animation/trigger';
import {
  crawlerSelection,
  experimentSelection,
  jobSelection,
  queueSelection,
  resetQueryFilterRequested
} from '../../store/shared.actions';
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
    this.clearSelection(filterName);
  }

  clearSelection(filterName: QueryFilterType): void {
    switch (filterName) {
      case QueryFilterType.Crawler:
        this.store.dispatch(crawlerSelection({ crawler: null }));
        break;
      case QueryFilterType.Queue:
        this.store.dispatch(queueSelection({ queue: null }));
        break;
      case QueryFilterType.Job:
        this.store.dispatch(jobSelection({ job: null }));
        break;
      case QueryFilterType.Experiment:
        this.store.dispatch(experimentSelection({ experiment: null }));
        break;
      default:
        break;
    }
  }
}
