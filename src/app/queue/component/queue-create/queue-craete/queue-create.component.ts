import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';
import { CrawlerService } from 'src/app/crawler/service/crawler.service';
import { selectCurrentCrawler } from 'src/app/crawler/store/crawler.selectors';
import { Crawler } from 'src/app/crawler/model/crawler';

@Component({
  selector: 'app-queue-create',
  templateUrl: './queue-create.component.html',
  styleUrls: ['./queue-create.component.scss']
})
export class QueueCreateComponent implements OnInit, OnDestroy {
  queueForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;
  queueLoader = false;
  queueCtrl = new FormControl('',[Validators.required]);
  crawler: any;
  Queues: any;
  experiment: any;
  currentCrawler$: Observable<Crawler | null>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private formBuilder: FormBuilder,
    @Optional() private experiementDialog: MatDialogRef<ExperimentCreateComponent>,
    public router: Router,
    public CrawlerService: CrawlerService
  ) {
    this.queueForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [null, [Validators.required]],
      start_at: [null, [Validators.required]]
    });
  }

  get name(): string | null {
    return this.queueForm.get('name')?.value;
  }

  get contactStartAt(): string | null {
    return this.queueForm.get('start_at')?.value;
  }

  get description(): string | null {
    return this.queueForm.get('description')?.value;
  }

  ngOnInit(): void {
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.currentCrawler$.subscribe((selectedCrawler: any) => {
      this.crawler = selectedCrawler;
      if (this.crawler) {
        this.queueCtrl.setValue(this.crawler.name);
        this.queueForm.controls['name'].setValue(this.crawler.id);
      }
    });

    this.isPopup = this.data.isPopup ? this.data.isPopup : false;
    this.queueCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search &&search.length >= 2) {
        this.queueLoader = true;
        this.CrawlerService.search(search).subscribe(
          (result: any) => {
            this.Queues = result.data;
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

  hasValue(controlName: string): boolean {
    return Boolean(this.queueForm.get(controlName)?.value);
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
    this.queueForm.controls['start_at'].setValue(item.start_at);
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
      this.experiementDialog.close(close);
    } else {
      this.router.navigate(['queues']);
    }
  }


  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
