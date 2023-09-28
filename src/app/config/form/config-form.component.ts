import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { ConfigurationService } from '@app/entity/service';
import { Configuration } from '@app/config/model/config';
import { TranslateModule } from '@ngx-translate/core';
import { AutocompleteSelectComponent } from '@shared/autocomplete-select/autocomplete-select.component';
import { NgClass, NgIf } from '@angular/common';
import { ButtonComponent } from '@shared/form/button/button.component';

@Component({
  selector: 'app-config-form',
  templateUrl: './config-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, AutocompleteSelectComponent, NgIf, ButtonComponent, NgClass],
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
      multilogin_id: [],
      multilogin_profile: [],
      location: [],
      active: [true]
    });
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
