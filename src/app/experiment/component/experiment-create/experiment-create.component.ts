import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ExperimentFormValues } from '../model/experiment-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { completeExperimentCreateRequested, updateExperimentCreateValues } from '../../store/experiment.actions';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExperimentService } from '../../service/experiment.service';

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
  experimentLoader = false;
  experimentCtrl = new FormControl('', [Validators.required]);
  experiments: any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private experiment: ExperimentService,
    private store: Store,
    private formBuilder: FormBuilder,
    @Optional() private experiementDialog: MatDialogRef<ExperimentCreateComponent>,
    public router: Router
  ) {}

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
    this.isPopup = this.data.isPopup ? this.data.isPopup : false;
    this.subscriptions.add(
      this.experimentForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ExperimentFormValues) => {
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

    this.experimentCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search.length >= 2) {
        this.experimentLoader = true;
        this.experiment.search(search).subscribe(
          (result: any) => {
            this.experiments = result.data;
            this.experimentLoader = false;
          },
          (error) => {
            this.experimentLoader = false;
          }
        );
      }
      this.experimentForm.controls['name'].setValue(search);
    });
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

  autoCompleteHasError(errorName: string) {
    return this.experimentCtrl?.touched && this.experimentCtrl?.invalid && this.experimentCtrl.getError(errorName);
  }

  setControlValue(item: any) {
    this.experimentForm.controls['name'].setValue(item.name);
    this.experimentForm.controls['contact'].setValue(item.contact);
    this.experimentForm.controls['description'].setValue(item.description);
  }

  reset() {
    this.experimentForm.reset();
    this.experimentCtrl.setValue(null);
  }

  saveExperiment(): void {
    if (!this.experimentForm.valid) {
      return;
    }
    this.store.dispatch(completeExperimentCreateRequested());
    this.experiment.newCreatedExperiment.subscribe((experimentCreated)=>{
      if(experimentCreated){
        this.onClose(true);
      }
    })
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.experiementDialog.close(close);
    } else {
      this.router.navigate(['experiments']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
