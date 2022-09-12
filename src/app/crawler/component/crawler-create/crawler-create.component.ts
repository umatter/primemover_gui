import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { completeCrawlerCreateRequested, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectCrawlerFormValid } from '../../store/crawler.selectors';
import {  selectExperimentsSimpleList } from '../../../experiment/store/experiment.selectors';
import { experimentsSimpleListRequested } from '../../../experiment/store/experiment.actions';
import { selectProxiesListData } from 'src/app/proxy/store/proxy.selectors';
@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnInit, OnDestroy {
  crawlerForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  experiments$: Observable<any>;
  proxies$:Observable<any>;
  configuration$:Observable<any>;
  agents$:Observable<any>;

  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router) {}

  ngOnInit(): void {
    this.store.dispatch(experimentsSimpleListRequested());
    
    this.proxies$ = this.store.pipe(select(selectProxiesListData));


    this.experiments$ = this.store.pipe(select(selectExperimentsSimpleList));
    this.experiments$.subscribe(x=>{
      console.log(x)
    })
    console.log(this.experiments$)
    this.experiments$.subscribe((value) => console.log(value));
    // this.formValid$ = this.store.pipe(select(selectCrawlerFormValid));
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]],
    });

    this.subscriptions.add(
      this.crawlerForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: CrawlerFormValues) => {
        this.store.dispatch(
          updateCrawlerCreateValues({
            name: formValue.name,
            description: formValue.description,
            valid: this.crawlerForm.valid,
            agent_id: 1,
            configuration_id: 1,
            experiment_id: 1,
            proxy_id: 1
          })
        );
      })
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.crawlerForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.crawlerForm.get(controlName)?.touched &&
      this.crawlerForm.get(controlName)?.invalid &&
      this.crawlerForm.get(controlName)?.getError(errorName)
    );
  }

  saveCrawler(): void {
    this.store.dispatch(completeCrawlerCreateRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
