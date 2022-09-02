import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExperimentFormValues } from '../model/experiment-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeExperimentCreateRequested, updateExperimentCreateValues } from '../../store/experiment.actions';
import { Router } from '@angular/router';
import { selectExperimentFormValid } from '../../store/experiment.selectors';

@Component({
  selector: 'app-experiment-create',
  templateUrl: './experiment-create.component.html',
  animations: [fadeIn]
})
export class ExperimentCreateComponent implements OnInit, OnDestroy {
  experimentForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;

  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router) {}

  get name(): string | null {
    return this.experimentForm.get('name')?.value;
  }

  get contact(): string | null {
    return this.experimentForm.get('contact')?.value;
  }

  get description(): string | null {
    return this.experimentForm.get('description')?.value;
  }

  ngOnInit(): void {
    this.formValid$ = this.store.pipe(select(selectExperimentFormValid));
    this.experimentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      contact: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]]
    });

    this.subscriptions.add(
      this.experimentForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ExperimentFormValues) => {
        this.store.dispatch(
          updateExperimentCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description,
            contact: formValue.contact,
            valid: this.experimentForm.valid
          })
        );
      })
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.experimentForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.experimentForm.get(controlName)?.touched &&
      this.experimentForm.get(controlName)?.invalid &&
      this.experimentForm.get(controlName)?.getError(errorName)
    );
  }

  saveExperiment(): void {
    this.store.dispatch(completeExperimentCreateRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
