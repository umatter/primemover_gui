import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { SharedActions } from '@shared/store/shared.actions';
import { SortBy, SortDirection } from '@shared/model/sort';
import { selectSort } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-link-sortable',
  templateUrl: './link-sortable.component.html',
  styleUrls: ['./link-sortable.component.scss'],
  imports: [NgIf],
  standalone: true
})
export class LinkSortableComponent {
  @Input() href: string = '';
  @Input() label: string = 'Label';
  @Input() sortIcon: boolean = false;
  @Input() sortDirection = SortDirection.ASC;
  @Input() sortBy: SortBy;
  @Output() sortRequested: EventEmitter<boolean> = new EventEmitter<boolean>();

  sort$ = this.store.select(selectSort);

  constructor(private store: Store) {}

  onClick(): void {
    this.setSortDirection();
    this.store.dispatch(
      SharedActions.sortRequested({
        sort: {
          sortBy: this.sortBy,
          sortDirection: this.sortDirection
        }
      })
    );

    this.sortRequested.emit(true);
  }

  setSortDirection(): void {
    this.sort$.subscribe((sort) => {
      this.sortDirection = sort.sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
    });
  }
}
