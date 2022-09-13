import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationFormValues } from '../model/config-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeConfigurationCreateRequested, updateConfigurationCreateValues } from '../../store/config.actions';
import { Router } from '@angular/router';
import { selectConfigurationsListData } from '../../store/config.selectors';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-config-create',
  templateUrl: './config-create.component.html',
  animations: [fadeIn]
})
export class ConfigCreateComponent implements OnInit, OnDestroy {
  configurationForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;

  constructor(@Optional() private configDialog: MatDialogRef<ConfigCreateComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private store: Store, private formBuilder: FormBuilder, public router: Router) { }

  get name(): string | null {
    return this.configurationForm.get('name')?.value;
  }

  get description(): string | null {
    return this.configurationForm.get('description')?.value;
  }

  ngOnInit(): void {
    // this.formValid$ = this.store.pipe(select(selectConfigurationFormValid));
    this.configurationForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]]
    });
    this.isPopup = this.data.isPopup;
    this.subscriptions.add(
      this.configurationForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ConfigurationFormValues) => {
        this.store.dispatch(
          updateConfigurationCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description,
          })
        );
      })
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.configurationForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.configurationForm.get(controlName)?.touched &&
      this.configurationForm.get(controlName)?.invalid &&
      this.configurationForm.get(controlName)?.getError(errorName)
    );
  }

  saveConfiguration(): void {

    if (!this.configurationForm.valid) {
      return
    }
    this.store.dispatch(completeConfigurationCreateRequested());
    this.onClose(true)
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.configDialog.close(close);
    } else {
      this.router.navigate(['configurations'])
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
