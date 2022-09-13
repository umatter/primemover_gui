import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExperimentFormValues } from '../model/experiment-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeExperimentCreateRequested, updateExperimentCreateValues } from '../../store/experiment.actions';
import { Router } from '@angular/router';
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
    this.experimentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      contact: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]]
    });
    this.isPopup = this.data.isPopup;
    this.subscriptions.add(
      this.experimentForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ExperimentFormValues) => {
        this.store.dispatch(
          updateExperimentCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description,
            contact: formValue.contact,
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
    if (!this.experimentForm.valid) {
      return
    }
    this.store.dispatch(completeExperimentCreateRequested());
    this.onClose(true)
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.experiementDialog.close(close)
    } else {
      this.router.navigate(['experiments'])
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
