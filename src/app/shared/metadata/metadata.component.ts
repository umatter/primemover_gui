import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Experiment } from 'src/app/experiment/model/experiment';
import { selectCurrentExperiment } from 'src/app/experiment/store/experiment.selectors';

@Component({
  selector: 'app-metadata',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss']
})
export class MetadataComponent implements OnInit {
  experiment: any;
  currentExperiment$: Observable<Experiment | null>;


  constructor(private store: Store) { }

  ngOnInit(): void {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));

    this.currentExperiment$.subscribe((currentExperiment)=>{
      this.experiment = currentExperiment      
  })
  }

}
