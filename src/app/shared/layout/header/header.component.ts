import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { fadeIn } from '../../animation/trigger';
import { QueryFilterType } from '../../store/shared.selectors';
import { QueryFilter } from '../../model/query-filter';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { AsyncPipe, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RemovableBadgeComponent } from '@shared/badge/removable-badge/removable-badge.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [AsyncPipe, TranslateModule, RemovableBadgeComponent, TitleCasePipe, NgForOf, NgIf],
  animations: [fadeIn]
})
export class HeaderComponent {
  queryFilter$: Observable<QueryFilter[]>;

  constructor(private store: Store) {
    this.queryFilter$ = this.store.select(selectQueryFilter);
  }

  resetQueryFilter(filterName: QueryFilterType): void {
    this.store.dispatch(SharedActions.resetQueryFilterRequested({ filterName: filterName }));
    this.clearSelection(filterName);
  }

  clearSelection(filterName: QueryFilterType): void {
    switch (filterName) {
      case QueryFilterType.Crawler:
        this.store.dispatch(SharedActions.crawlerSelection({ crawler: null }));
        break;
      case QueryFilterType.Queue:
        this.store.dispatch(SharedActions.queueSelection({ queue: null }));
        break;
      case QueryFilterType.Job:
        this.store.dispatch(SharedActions.jobSelection({ job: null }));
        break;
      case QueryFilterType.Experiment:
        this.store.dispatch(SharedActions.experimentSelection({ experiment: null }));
        break;
      default:
        break;
    }
  }
}
