import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Job } from '@app/job/model/Job';
import { Store } from '@ngrx/store';
import { BehaviorService } from '@app/entity/service';
import { Behavior } from '@app/behavior/behavior';
import { selectCurrentJob } from '@shared/store/shared.selectors';

@Component({
  selector: 'app-behavior-form',
  templateUrl: './behavior-form.component.html'
})
export class BehaviorFormComponent implements OnDestroy {
  @Output() saveClicked = new EventEmitter<Behavior>();
  @Output() cancelClicked = new EventEmitter<void>();
  entityForm: FormGroup;
  subscriptions = new Subscription();
  filteredBehaviors$: Observable<Behavior[]>;
  showAutocompletion: boolean;
  behaviorAutocompletion = new FormControl('', [Validators.required]);

  constructor(private store: Store, private formBuilder: FormBuilder, private entityService: BehaviorService) {
    this.filteredBehaviors$ = entityService.filteredEntities$;
    this.initEntityForm();
    this.initEntityAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.entityForm.get('description') as FormControl;
  }

  get value(): UntypedFormControl {
    return this.entityForm.get('value') as FormControl;
  }

  get jobId(): UntypedFormControl {
    return this.entityForm.get('job_id') as FormControl;
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
    this.behaviorAutocompletion.setValue(formValue.name);
    this.showAutocompletion = false;
  }

  onCancel(): void {
    this.reset();
    this.cancelClicked.emit();
  }

  onSave(): void {
    this.saveClicked.emit(this.entityForm.value);
    this.reset();
  }

  reset() {
    this.behaviorAutocompletion.setValue(null);
    this.entityForm.reset();
  }

  initEntityAutocompletion(): void {
    this.subscriptions.add(
      this.behaviorAutocompletion.valueChanges.pipe().subscribe((search) => {
        this.showAutocompletion = Boolean(search);
        this.entityService.setFilter(search);
        this.name.setValue(search);
      })
    );
  }

  initEntityForm(): void {
    this.entityForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.required]],
      value: [null, [Validators.required]],
      job_id: [null, [Validators.required]]
    });

    this.subscriptions.add(
      this.store
        .select(selectCurrentJob)
        .pipe()
        .subscribe((job) => {
          this.jobId.setValue(job?.id);
          this.showAutocompletion = false;
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
