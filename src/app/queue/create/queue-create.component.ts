import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Crawler } from '@app/crawler/model/crawler';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { selectCurrentCrawler } from '@shared/store/shared.selectors';
import { fadeIn } from '@shared/animation/trigger';
import { CrawlerService, QueueService } from '@app/entity/service';
import { Queue } from '@app/queue/model/queue';
import { TranslateModule } from '@ngx-translate/core';
import { AutocompleteSelectComponent } from '@shared/autocomplete-select/autocomplete-select.component';
import { HeroiconTrashComponent } from '@shared/icon/heroicon-trash/heroicon-trash.component';
import { Router, RouterLink } from '@angular/router';
import { TimezoneDetail, TimezoneService } from '@shared/service/timezone.service';
import { SharedActions } from '@shared/store/shared.actions';
import { selectTimezoneDetail, selectTimezoneList, selectTimezoneLoading } from '@shared/store/shared.reducer';
import { ConfirmationModalComponent } from '@shared/dialog/confirmation-modal/confirmation-modal.component';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';

export const TIMEZONE = 'Europe/Berlin';

@Component({
  selector: 'app-queue-create',
  templateUrl: './queue-create.component.html',
  animations: [fadeIn],
  providers: [DatePipe],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AutocompleteSelectComponent,
    HeroiconTrashComponent,
    NgIf,
    NgClass,
    RouterLink,
    AsyncPipe,
    NgForOf,
    ConfirmationModalComponent,
    LoadingSpinnerComponent
  ],
  standalone: true
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
  timezoneList$: Observable<string[]> = this.store.select(selectTimezoneList);
  timezoneDetail$: Observable<TimezoneDetail> = this.store.select(selectTimezoneDetail);
  timezoneLoading$: Observable<boolean> = this.store.select(selectTimezoneLoading);
  isLoading$ = this.entityService.loading$;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private entityService: QueueService,
    private crawlerService: CrawlerService,
    private timezoneService: TimezoneService,
    private router: Router
  ) {
    this.initEntityAutocompletion();
    this.initEntityForm();

    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.filteredQueues$ = entityService.filteredEntities$;
    this.filteredCrawlers$ = crawlerService.filteredEntities$;
    this.timezoneList$ = this.timezoneService.getList();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get timezone(): UntypedFormControl {
    return this.entityForm.get('timezone') as FormControl;
  }

  get timezoneOffset(): UntypedFormControl {
    return this.entityForm.get('timezone_utc_offset') as FormControl;
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

  initTimezoneSelection(): void {
    this.store.dispatch(SharedActions.timezoneDetailRequested({ timezone: TIMEZONE }));
    this.entityForm.patchValue({
      timezone: TIMEZONE
    });
    this.subscriptions.add(
      this.timezoneDetail$.pipe().subscribe((detail) => this.timezoneOffset.patchValue(detail?.utc_offset))
    );
  }

  initEntityForm(): void {
    this.entityForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      description: [null, [Validators.required]],
      start_at: [null, [Validators.required]],
      crawler_id: [null, [Validators.required]],
      timezone: [null, [Validators.required]],
      timezone_utc_offset: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.initTimezoneSelection();
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
    this.entityForm.patchValue({
      ...formValue,
      start_at: this.datePipe.transform(formValue.start_at, 'yyyy-MM-ddThh:mm')
    });
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
    this.router.navigate(['/queues']).then(() => false);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store.dispatch(SharedActions.timezoneResetRequested());
  }

  setFormValuesToSelectedCrawler(crawler: Crawler) {
    this.crawlerAutocompletion.setValue(crawler.name);
    this.crawlerId.setValue(crawler.id);
  }

  onTimezoneChange() {
    const selectedTimezone = this.timezone.value;
    if (selectedTimezone) {
      this.store.dispatch(SharedActions.timezoneDetailRequested({ timezone: selectedTimezone }));
    }
  }
}
