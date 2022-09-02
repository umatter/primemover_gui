import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { selectQueryFilter } from '../store/shared.selectors';
import { first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QueryFilterService {
  filterString = 'filter[%placeholder%]';
  queryFilterParams = {};

  constructor(private store: Store) {}

  getFilterParams(): any {
    this.clearFilterParams();
    this.buildFilterParams();
    return this.queryFilterParams;
  }

  clearFilterParams(): void {
    this.queryFilterParams = {};
  }

  buildFilterParams(): void {
    this.store.pipe(select(selectQueryFilter), first()).subscribe((queryFilter) => {
      if (queryFilter.length) {
        queryFilter.forEach((entry) => {
          const filterName = this.replaceFilterName(entry.name);
          this.queryFilterParams = { ...this.queryFilterParams, [filterName]: entry.value };
        });
      }
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
