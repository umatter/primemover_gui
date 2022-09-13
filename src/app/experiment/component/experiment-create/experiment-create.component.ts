import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExperimentFormValues } from '../model/experiment-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeExperimentCreateRequested, updateExperimentCreateValues } from '../../store/experiment.actions';
import { Router } from '@angular/router';
import { selectExperimentFormValid } from '../../store/experiment.selectors';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-experiment-create',
  templateUrl: './experiment-create.component.html',
  animations: [fadeIn]
})
export class ExperimentCreateComponent implements OnInit, OnDestroy {
  experimentForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private store: Store, private formBuilder: FormBuilder, @Optional() private experiementDialog: MatDialogRef<ExperimentCreateComponent>, public router: Router) { }

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
    this.isPopup = this.data.isPopup;
    console.log(this.isPopup)
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
    console.log('eee')
    this.store.dispatch(completeExperimentCreateRequested());
    if (this.isPopup) {
      this.experiementDialog.close(true);
    }
  }

  onClose() {
    console.log(this.isPopup)
    if (this.isPopup) {
      this.experiementDialog.close(true)
    } else {
      this.router.navigate(['experiments'])
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
