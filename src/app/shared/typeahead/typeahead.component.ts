import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-typeahead',
  templateUrl: './typeahead.component.html',
  styleUrls: ['./typeahead.component.scss']
})
export class TypeaheadComponent {
  @ViewChild('search') search: ElementRef<HTMLInputElement>;

  @Input() controlField: any;
  @Input() dataSet: any;
  @Input() searchText!: string;
  @Input() maxLen!: number;

  @Output() typeahead: EventEmitter<any> = new EventEmitter();
  @Output() resetEmit: EventEmitter<any> = new EventEmitter();

  filterSet: any;
  isVisible: boolean;
  isCursorOverFilterSet!: boolean;
  isArryDataSet!: boolean;


  constructor() {
  }

  ngOnInit() {
    this.dataSet = this.dataSet || [];
    this.searchText = this.searchText || '';
    this.maxLen = this.maxLen || 5;
    this.filterSet = [];
    this.isVisible = false;
  }


  onSearch() {
    let search = this.search.nativeElement.value;
    if (search.length >= 2) {
      this.filterSet = this.dataSet.filter((item: any) => {
        return item.name
          .toLowerCase()
          .indexOf(search.toLowerCase()) > -1
      });
      this.filterSet = this.filterSet.slice(0, this.maxLen);
      this.showList();
    } else {
      this.filterSet = [];
    }

  }

  hideList() {
    if (this.isCursorOverFilterSet != true) {
      this.isVisible = false;
    }
  }

  showList() {
    let search = this.search.nativeElement.value;
    if (search.length > 0) {
      this.isVisible = true;
    }
  }

  cursorOverSet() {
    this.showList();
    this.isCursorOverFilterSet = true;
  }

  setValue(item: any) {
    this.search.nativeElement.value = item.name;
    this.filterSet = [];
    this.filterSet.push(item);
    this.isCursorOverFilterSet = false;
    this.hideList();
    this.typeahead.emit({ type: this.controlField, id: item.id });
  }


  reset() {
    this.search.nativeElement.value = '';

    this.resetEmit.emit({ type: this.controlField });
  }
}

