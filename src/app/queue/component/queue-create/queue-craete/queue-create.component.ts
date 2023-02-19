import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';
import { selectCurrentCrawler } from 'src/app/crawler/store/crawler.selectors';
import { Crawler } from 'src/app/crawler/model/crawler';
import { QueueService } from 'src/app/queue/service/queue.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-queue-create',
  templateUrl: './queue-create.component.html',
  styleUrls: ['./queue-create.component.scss']
})
export class QueueCreateComponent implements OnInit, OnDestroy {
  queueForm: FormGroup;
  subscriptions = new Subscription();
  isPopup = false;
  queueLoader = false;
  queueCtrl = new FormControl('', [Validators.required]);
  crawlerCtrl = new FormControl(null, [Validators.required]);
  crawler: any;
  queueList: any;
  experiment: any;
  currentCrawler$: Observable<Crawler | null>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private formBuilder: FormBuilder,
    @Optional() private experimentDialog: MatDialogRef<ExperimentCreateComponent>,
    public router: Router,
    public queueService: QueueService,
    private datePipe: DatePipe
  ) {
    this.queueForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [null, [Validators.required]],
      start_at: [null, [Validators.required]],
      crawler_id: [null, [Validators.required]]
    });
  }

  get name(): string | null {
    return this.queueForm.get('name')?.value;
  }

  get description(): string | null {
    return this.queueForm.get('description')?.value;
  }

  ngOnInit(): void {
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.currentCrawler$.subscribe((selectedCrawler: any) => {
      this.crawler = selectedCrawler;
      this.crawlerCtrl.setValue(selectedCrawler.id ?? null);
    });

    this.isPopup = this.data.isPopup ? this.data.isPopup : false;
    this.queueCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search.length >= 2) {
        this.queueLoader = true;
        this.queueService.search(search).subscribe(
          (result: any) => {
            this.queueList = result.data;
            this.queueLoader = false;
          },
          (error: any) => {
            this.queueLoader = false;
          }
        );
      }
      this.queueForm.controls['name'].setValue(search);
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.queueForm.get(controlName)?.touched &&
      this.queueForm.get(controlName)?.invalid &&
      this.queueForm.get(controlName)?.getError(errorName)
    );
  }

  autoCompleteHasError(errorName: string) {
    return this.queueCtrl?.touched && this.queueCtrl?.invalid && this.queueCtrl.getError(errorName);
  }

  setControlValue(item: any) {
    this.queueForm.controls['name'].setValue(item.name);
    this.queueForm.controls['description'].setValue(item.description);
    this.queueForm.controls['start_at'].setValue(this.datePipe.transform(item.start_at, 'yyyy-MM-dd'));
  }

  reset() {
    // this.queueForm.reset();
    this.queueCtrl.setValue(null);
    this.queueForm.controls['name'].setValue(null);
  }

  saveExperiment(): void {
    if (!this.queueForm.valid) {
      return;
    }
    this.onClose(true);
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.experimentDialog.close(close);
    } else {
      this.router.navigate(['queues']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
