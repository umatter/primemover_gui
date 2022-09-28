import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, fromEvent, map } from 'rxjs';
import { AgentService } from "../../agent/service/agent.service";
import { ConfigService } from "../../config/service/config.service";
import { ExperimentService } from "../../experiment/service/experiment.service"
import { ProxyService } from "../../proxy/service/proxy.service"

@Component({
  selector: 'app-typeahead',
  templateUrl: './typeahead.component.html',
  styleUrls: ['./typeahead.component.scss']
})
export class TypeaheadComponent {
  @ViewChild('search', { static: true }) search: ElementRef;

  @Input() controlField: any;
  @Input() set searchText(value: any) {
    if (value?.length) {
      this.search.nativeElement.value = value
    }
  }

  @Output() typeahead: EventEmitter<any> = new EventEmitter();
  @Output() resetEmit: EventEmitter<any> = new EventEmitter();

  filterSet: any;
  isVisible: boolean;
  isCursorOverFilterSet!: boolean;
  isArryDataSet!: boolean;
  constructor(private agent: AgentService, private proxy: ProxyService, private configuration: ConfigService, private experiment: ExperimentService) {
  }

  ngOnInit() {
    this.filterSet = [];
    this.isVisible = false;

    fromEvent(this.search.nativeElement, 'keyup',).pipe(
      // get value
      map((event: any) => {
        return event.target.value;
      })
      // if character length greater then 2
      , filter(res => res.length >= 2)
      // Time in milliseconds between key events
      , debounceTime(1000)
      // If previous query is diffent from current   
      , distinctUntilChanged()
      // subscription for response
    ).subscribe((text: string) => {

      let service = this.controlField === 'experiment_id' ? this.experiment : this.controlField === 'agent_id' ? this.agent : this.controlField === 'configuration_id' ? this.configuration : this.proxy;
      let search = text;
      if (search.length >= 2) {
        service.search(search).subscribe((result: any) => {
          this.filterSet = result.data
          this.showList();
        })
      } else {
        this.filterSet = [];
      }
    });
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
    // this.filterSet.push(item);
    this.isCursorOverFilterSet = false;
    this.hideList();
    this.typeahead.emit({ type: this.controlField, item });
  }


  reset() {
    this.search.nativeElement.value = '';
    this.resetEmit.emit({ type: this.controlField });
  }
}

