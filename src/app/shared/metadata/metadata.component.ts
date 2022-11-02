import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Crawler } from 'src/app/crawler/model/crawler';
import { selectCurrentCrawler } from 'src/app/crawler/store/crawler.selectors';
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
  currentCrawler$: Observable<Crawler | null>;
  crawler: any;
  multilogin: any;


  constructor(private store: Store) { }

  ngOnInit(): void {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));

    this.currentExperiment$.subscribe((currentExperiment)=>{
      this.experiment = currentExperiment      
  })

  this.currentCrawler$.subscribe((selectedCrawler:any)=>{
    if(selectedCrawler){
      this.crawler = selectedCrawler   
    }
  })
  }

  multiloginProfile(data:any){
    if(data){
      this.multilogin = JSON.parse(JSON.parse(JSON.stringify(data)))
    }
  }

}
