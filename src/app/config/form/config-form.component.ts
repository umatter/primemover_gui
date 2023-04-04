import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { ConfigurationService } from '@app/entity/service';
import { Configuration } from '@app/config/model/config';
import { updateConfigurationCreateValues } from '@app/config/store/config.actions';

@Component({
  selector: 'app-config-form',
  templateUrl: './config-form.component.html',
  animations: [fadeIn]
})
export class ConfigFormComponent implements OnDestroy {
  @Output() saveClicked = new EventEmitter<Configuration>();
  @Output() cancelClicked = new EventEmitter<void>();

  entityForm: FormGroup;
  subscriptions = new Subscription();
  filteredConfigurations$: Observable<Configuration[]>;
  showAutocompletion: boolean;

  constructor(private store: Store, private formBuilder: FormBuilder, private entityService: ConfigurationService) {
    this.filteredConfigurations$ = entityService.filteredEntities$;
    this.initEntityForm();
    this.initEntityAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.entityForm.get('description') as FormControl;
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.entityForm.get(controlName)?.touched &&
      this.entityForm.get(controlName)?.invalid &&
      this.entityForm.get(controlName)?.getError(errorName)
    );
  }

  initEntityAutocompletion(): void {
    this.entityService.getAll();
    this.subscriptions.add(
      this.name.valueChanges.pipe().subscribe((search) => {
        this.showAutocompletion = true;
        this.entityService.setFilter(search);
      })
    );
  }

  initEntityForm(): void {
    this.entityForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      identification: [],
      multiLoginId: [],
      multiLoginProfile: [],
      location: [],
      active: [true]
    });

    this.subscriptions.add(
      this.entityForm.valueChanges
        .pipe(distinctUntilChanged(), debounceTime(100))
        .subscribe((formValue: Configuration) => {
          this.store.dispatch(updateConfigurationCreateValues(formValue));
        })
    );
  }

  setFormValuesToSelectedAgent(formValue: Configuration): void {
    this.showAutocompletion = false;
    this.entityForm.patchValue(formValue);
  }

  onCancel(): void {
    this.cancelClicked.emit();
    this.reset();
  }

  onSave(): void {
    this.saveClicked.emit(this.entityForm.value);
    this.reset();
  }

  reset() {
    this.entityForm.reset();
    this.name.setValue(null);
    this.showAutocompletion = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
