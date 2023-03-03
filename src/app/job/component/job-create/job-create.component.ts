import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { Crawler } from 'src/app/crawler/model/crawler';
import { selectCurrentCrawler } from 'src/app/crawler/store/crawler.selectors';
import { ExperimentFormValues } from 'src/app/experiment/component/model/experiment-form-values';
import { updateExperimentCreateValues } from 'src/app/experiment/store/experiment.actions';
import { JobService } from '../../service/job.service';
import { QueueService } from 'src/app/queue/service/queue.service';
import { jobsRequested } from '../../store/job.actions';
import { Queue } from 'src/app/queue/model/queue';
import { selectCurrentQueue } from '../../store/job.selectors';

@Component({
  selector: 'app-job-create',
  templateUrl: './job-create.component.html'
})
export class JobCreateComponent implements OnInit, OnDestroy {
  jobForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;
  jobLoader = false;
  jobCtrl = new FormControl('', [Validators.required]);
  queueCtrl = new FormControl('', [Validators.required]);

  crawler: any;
  queue: any
  jobs: any;
  queues: any;
  job: any;
  currentCrawler$: Observable<Crawler | null>;
  currentQueue$: Observable<Queue | null>;
  experiementDialog: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router,
    public jobService: JobService,
    private queueService: QueueService,
  ) {
    this.jobForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      type: [null, [Validators.required]],
      queue_id: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.currentQueue$ = this.store.pipe(select(selectCurrentQueue));

    this.currentCrawler$.subscribe((selectedCrawler: any) => {
      this.crawler = selectedCrawler;
    });
    this.currentQueue$.subscribe((selectedQueue: any) => {
      this.queue = selectedQueue;
    });
    if (this.queue) {
      this.queueCtrl.setValue(this.queue.name);
      this.jobForm.controls['queue_id'].setValue(this.queue.id);
    }
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
      if (search && search.length >= 2) {
        this.jobLoader = true;
        this.jobService.search(search).subscribe(
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

    this.queueCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search.length >= 2) {
        this.jobLoader = true;
        this.queueService.search(search).subscribe(
          (result: any) => {
            this.queues = result.data;
            this.jobLoader = false;
          },
          (error: any) => {
            this.jobLoader = false;
          }
        );
      }
    });
  }

  setControlValue(item: any) {
    this.jobForm.controls['name'].setValue(item.name);
    this.jobForm.controls['description'].setValue(item.description);
    this.jobForm.controls['type'].setValue(item.type);
  }

  setQueueControlValue(item: any) {
    this.jobForm.controls['queue_id'].setValue(item.id);
  }

  reset() {
    this.jobForm.reset();
    this.jobCtrl.setValue(null);
    this.jobForm.controls['name'].setValue(null);
  }

  resetQueue() {
    this.queueCtrl.setValue(null);
    this.jobForm.controls['queue_id'].setValue(null);
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.experiementDialog.close(close);
    } else {
      this.router.navigate(['jobs']);
    }
  }

  saveJob(): void {
    if (!this.jobForm.valid) {
      return;
    }
    // make an end point on store
    this.store.dispatch(jobsRequested());
    // this.onClose(true)
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.jobForm.get(controlName)?.touched &&
      this.jobForm.get(controlName)?.invalid &&
      this.jobForm.get(controlName)?.getError(errorName)
    );
  }

  autoCompleteHasError(errorName: string) {
    return this.jobCtrl?.touched && this.jobCtrl?.invalid && this.jobCtrl.getError(errorName);
  }
  
  autoCompleteQueueHasError(errorName: string) {
    return this.queueCtrl?.touched && this.queueCtrl?.invalid && this.queueCtrl.getError(errorName);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
