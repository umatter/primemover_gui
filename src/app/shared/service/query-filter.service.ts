import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectQueryFilter } from '../store/shared.selectors';
import { filter, first, Observable } from 'rxjs';
import { QueryFilter } from '@shared/model/query-filter';

@Injectable({
  providedIn: 'root'
})
export class QueryFilterService {
  filterString = 'filter[%placeholder%]';
  queryFilterParams = {};
  queryFilter$: Observable<QueryFilter[]>;

  constructor(private store: Store) {}

  getFilterParams(ofType: string[] = []): object {
    this.clearFilterParams();
    this.buildFilterParams();
    this.applyTypeFilter(ofType);
    return this.queryFilterParams;
  }

  clearFilterParams(): void {
    this.queryFilterParams = {};
  }

  buildFilterParams(): void {
    this.queryFilter$ = this.store.select(selectQueryFilter).pipe(
      first(),
      filter((items: QueryFilter[]) => items.every((entry) => entry.name && entry.value))
    );
  }

  applyTypeFilter(ofType: string[]): void {
    this.queryFilter$.subscribe((queryFilter) => {
      if (ofType.length > 0) {
        queryFilter = queryFilter.filter((entry) => ofType.includes(entry.name));
      }

      queryFilter.map((entry) => {
        const filterName = this.replaceFilterName(entry.name);
        this.queryFilterParams = { ...this.queryFilterParams, [filterName]: entry.value };
      });
    });
  }

  replaceFilterName(filterName: string) {
    if (!this.filterString) {
      return filterName;
    }
    if (!this.filterString.match(/%placeholder%/g)) {
      return filterName;
    }
    return this.filterString.replace(/%placeholder%/g, filterName);
  }
}
