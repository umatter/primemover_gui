import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Subscription, Observable, debounceTime, distinctUntilChanged } from 'rxjs';
import { Crawler } from 'src/app/crawler/model/crawler';
import { selectCurrentCrawler } from 'src/app/crawler/store/crawler.selectors';
import { ExperimentFormValues } from 'src/app/experiment/component/model/experiment-form-values';
import { updateExperimentCreateValues } from 'src/app/experiment/store/experiment.actions';
import { CrawlerService } from 'src/app/crawler/service/crawler.service';

@Component({
  selector: 'app-job-create',
  templateUrl: './job-create.component.html',
  styleUrls: ['./job-create.component.scss']
})
export class JobCreateComponent implements OnInit {
  jobForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;
  jobLoader = false;
  jobCtrl = new FormControl();
  crawler: any;
  jobs: any;
  job: any;
  currentCrawler$: Observable<Crawler | null>;
  experiementDialog: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private crawlerService: CrawlerService,
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router
  ) {
    this.jobForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      type: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {

    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.currentCrawler$.subscribe((selectedCrawler: any) => {
      this.crawler = selectedCrawler;
    });
    if (this.crawler) {
      this.jobCtrl.setValue(this.crawler.name);
      this.jobForm.controls['name'].setValue(this.crawler.id);
    }

    this.isPopup = this.data.isPopup ? this.data.isPopup : false;
    this.subscriptions.add(
      this.jobForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ExperimentFormValues) => {
        this.store.dispatch(
          updateExperimentCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description,
            contact: formValue.contact
          })
        );
      })
    );

    this.jobCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search.length >= 2) {
        this.jobLoader = true;
        this.crawlerService.search(search).subscribe(
          (result: any) => {
            this.jobs = result.data;
            this.jobLoader = false;
          },
          (error: any) => {
            this.jobLoader = false;
          }
        );
      }
      this.jobForm.controls['name'].setValue(search);
    });
  }

  setControlValue(item: any) {
    this.jobForm.controls['name'].setValue(item.name);
    this.jobForm.controls['description'].setValue(item.description);
    this.jobForm.controls['type'].setValue(item.type);
  }

  reset() {
    this.jobForm.reset();
    this.jobCtrl.setValue(null);
    this.jobForm.controls['name'].setValue(null);
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.experiementDialog.close(close);
    } else {
      this.router.navigate(['jobs']);
    }
  }

  saveExperiment(): void {
    if (!this.jobForm.valid) {
      return;
    }
    console.log('all form', this.jobForm);
    // make an end point on store
    // this.store.dispatch(completeExperimentCreateRequested());
    // this.onClose(true)
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
