import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Crawler } from '@app/crawler/model/crawler';
import { DatePipe } from '@angular/common';
import { selectCurrentCrawler } from '@shared/store/shared.selectors';
import { fadeIn } from '@shared/animation/trigger';
import { CrawlerService, QueueService } from '@app/entity/service';
import { Queue } from '@app/queue/model/queue';

@Component({
  selector: 'app-queue-create',
  templateUrl: './queue-create.component.html',
  animations: [fadeIn]
})
export class QueueCreateComponent implements OnInit, OnDestroy {
  entityForm: FormGroup;
  subscriptions = new Subscription();
  queueAutocompletion = new FormControl('', [Validators.required]);
  crawlerAutocompletion = new FormControl('', [Validators.required]);
  currentCrawler$: Observable<Crawler | null>;
  showAutocompletion: boolean;
  showCrawlerAutocompletion: boolean;
  filteredQueues$: Observable<Queue[]>;
  filteredCrawlers$: Observable<Crawler[]>;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private entityService: QueueService,
    private crawlerService: CrawlerService
  ) {
    this.initEntityAutocompletion();
    this.initEntityForm();
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.filteredQueues$ = entityService.filteredEntities$;
    this.filteredCrawlers$ = crawlerService.filteredEntities$;
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.entityForm.get('description') as FormControl;
  }

  get crawlerId(): UntypedFormControl {
    return this.entityForm.get('crawler_id') as FormControl;
  }

  get startAt(): UntypedFormControl {
    return this.entityForm.get('start_at') as FormControl;
  }

  initEntityAutocompletion(): void {
    this.entityService.getAll();
    this.crawlerService.getAll();
    this.subscriptions.add(
      this.queueAutocompletion.valueChanges.pipe().subscribe((search) => {
        this.showAutocompletion = Boolean(search);
        this.entityService.setFilter(search);
        this.name.setValue(search);
      })
    );
    this.subscriptions.add(
      this.crawlerAutocompletion.valueChanges.pipe().subscribe((search) => {
        this.showCrawlerAutocompletion = Boolean(search);
        this.crawlerService.setFilter(search);
      })
    );
  }

  initEntityForm(): void {
    this.entityForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [null, [Validators.required]],
      start_at: [null, [Validators.required]],
      crawler_id: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.currentCrawler$.subscribe((selectedCrawler) => {
      if (selectedCrawler) {
        this.setFormValuesToSelectedCrawler(selectedCrawler);
        this.crawlerAutocompletion.disable();
        this.showCrawlerAutocompletion = false;
      }
    });
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.entityForm.get(controlName)?.touched &&
      this.entityForm.get(controlName)?.invalid &&
      this.entityForm.get(controlName)?.getError(errorName)
    );
  }

  resetCrawler() {
    this.crawlerAutocompletion.setValue(null);
  }

  setFormValuesToSelectedEntity(formValue: Queue): void {
    this.entityForm.patchValue(formValue);
    this.queueAutocompletion.setValue(formValue.name);
    this.crawlerAutocompletion.setValue(formValue.crawler.name);
    this.showAutocompletion = false;
    this.showCrawlerAutocompletion = false;
  }

  onCancel(): void {
    this.reset();
  }

  onSave(): void {
    this.entityService
      .add(this.entityForm.value)
      .pipe()
      .subscribe(() => this.reset());
  }

  reset() {
    this.crawlerAutocompletion.setValue(null);
    this.queueAutocompletion.setValue(null);
    this.entityForm.reset();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  setFormValuesToSelectedCrawler(crawler: Crawler) {
    this.crawlerAutocompletion.setValue(crawler.name);
    this.crawlerId.setValue(crawler.id);
  }
}
