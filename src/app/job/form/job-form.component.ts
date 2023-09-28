import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Proxy } from '@app/proxy/model/proxy';
import { Queue } from '@app/queue/model/queue';
import { Job } from '@app/job/model/Job';
import { JobService, QueueService } from '@app/entity/service';
import { selectCurrentQueue } from '@shared/store/shared.selectors';
import { JobType } from '@app/enum/job-type.enum';

@Component({
  selector: 'app-job-form',
  templateUrl: './job-form.component.html'
})
export class JobFormComponent implements OnDestroy {
  @Output() saveClicked = new EventEmitter<Proxy>();
  @Output() cancelClicked = new EventEmitter<void>();
  entityForm: FormGroup;
  subscriptions = new Subscription();
  filteredQueues$: Observable<Queue[]>;
  filteredJobs$: Observable<Job[]>;
  showQueueAutocompletion: boolean;
  showJobAutocompletion: boolean;
  jobTypes = Object.values(JobType);
  jobAutocompletion = new FormControl('', [Validators.required]);
  queueAutocompletion = new FormControl('', [Validators.required]);

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private entityService: JobService,
    private queueService: QueueService
  ) {
    this.filteredJobs$ = entityService.filteredEntities$;
    this.filteredQueues$ = queueService.filteredEntities$;
    this.initEntityForm();
    this.initEntityAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.entityForm.get('description') as FormControl;
  }

  get type(): UntypedFormControl {
    return this.entityForm.get('type') as FormControl;
  }

  get queueId(): UntypedFormControl {
    return this.entityForm.get('queue_id') as FormControl;
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.entityForm.get(controlName)?.touched &&
      this.entityForm.get(controlName)?.invalid &&
      this.entityForm.get(controlName)?.getError(errorName)
    );
  }

  setFormValuesToSelectedEntity(formValue: Job): void {
    this.entityForm.patchValue(formValue);
    this.jobAutocompletion.setValue(formValue.name);
    this.queueAutocompletion.setValue(String(formValue.queue_id));
    this.showQueueAutocompletion = false;
  }

  setFormValuesToSelectedQueue(formValue: Queue): void {
    this.entityForm.patchValue({
      queue_id: formValue.id
    });
    this.queueAutocompletion.setValue(formValue.name);
  }

  onCancel(): void {
    this.reset();
  }

  onSave(): void {
    this.entityService.add(this.entityForm.value);
    this.reset();
  }

  reset() {
    this.jobAutocompletion.setValue(null);
    this.entityForm.reset(true, { emitEvent: false });
    this.resetQueueAutocompletion();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  initEntityAutocompletion() {
    this.entityService.getAll();
    this.queueService.getAll();
    this.subscriptions.add(
      this.jobAutocompletion.valueChanges.pipe().subscribe((search) => {
        this.showJobAutocompletion = Boolean(search);
        this.entityService.setFilter(search);
        this.name.setValue(search);
      })
    );
    this.subscriptions.add(
      this.queueAutocompletion.valueChanges.pipe().subscribe((search) => {
        this.showQueueAutocompletion = Boolean(search);
        this.queueService.setFilter(search);
      })
    );
  }

  resetQueueAutocompletion() {
    this.queueAutocompletion.enable();
    this.queueAutocompletion.setValue(null);
  }

  initEntityForm(): void {
    this.entityForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null],
      type: [null, [Validators.required]],
      queue_id: [null, [Validators.required]]
    });

    this.subscriptions.add(
      this.store.pipe(select(selectCurrentQueue)).subscribe((currentQueue) => {
        if (currentQueue) {
          this.queueId.setValue(currentQueue.id);
          this.queueAutocompletion.setValue(currentQueue.name);
          this.queueAutocompletion.disable();
        }
      })
    );
  }
}
