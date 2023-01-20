import { Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfigurationFormValues } from '../model/config-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { completeConfigurationCreateRequested, updateConfigurationCreateValues } from '../../store/config.actions';
import { Router } from '@angular/router';
import { selectConfigurationsListData } from '../../store/config.selectors';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigService } from '../../service/config.service';

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
  selected = false;
  configCtrl = new FormControl();
  configLoader: boolean = false;
  configurations: any;

  constructor(
    @Optional() private configDialog: MatDialogRef<ConfigCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,

    private config: ConfigService,
    private formBuilder: FormBuilder,
    public router: Router
  ) {}

  get name(): string | null {
    return this.configurationForm.get('name')?.value;
  }

  get description(): string | null {
    return this.configurationForm.get('description')?.value;
  }

  ngOnInit(): void {
    this.configurationForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      id: ['']
    });
    this.isPopup = this.data.isPopup;
    this.subscriptions.add(
      this.configurationForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ConfigurationFormValues) => {
        this.store.dispatch(
          updateConfigurationCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description
          })
        );
      })
    );

    this.configCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search.length >= 2) {
        this.configLoader = true;
        this.config.search(search).subscribe(
          (result: any) => {
            this.configurations = result.data;
            this.configLoader = false;
          },
          (error) => {
            this.configLoader = false;
          }
        );
      }
      this.configurationForm.controls['name'].setValue(search);
    });
  }

  reset() {
    this.configurationForm.reset();
    this.configCtrl.setValue(null);
    this.selected = false;
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

  setControlValue(item: any) {
    this.configurationForm.controls['id'].setValue(item.id);
    this.configurationForm.controls['name'].setValue(item.name);
    this.configurationForm.controls['description'].setValue(item.description);
    this.selected = true;
  }

  saveConfiguration(): void {
    if (!this.configurationForm.valid) {
      return;
    }

    if (!this.selected) {
      this.store.dispatch(completeConfigurationCreateRequested());
    }
    this.onClose(true);
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.configDialog.close(this.configurationForm.value);
    } else {
      this.router.navigate(['configurations']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
