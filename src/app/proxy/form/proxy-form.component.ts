import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { Proxy } from '@app/proxy/model/proxy';
import { ProxyService } from '@app/entity/service';

@Component({
  selector: 'app-proxy-form',
  templateUrl: './proxy-form.component.html',
  animations: [fadeIn]
})
export class ProxyFormComponent implements OnDestroy {
  @Output() saveClicked = new EventEmitter<Proxy>();
  @Output() cancelClicked = new EventEmitter<void>();
  entityForm: FormGroup;
  subscriptions = new Subscription();
  filteredProxies$: Observable<Proxy[]>;
  showAutocompletion: boolean;

  constructor(private store: Store, private formBuilder: FormBuilder, private entityService: ProxyService) {
    this.filteredProxies$ = entityService.filteredEntities$;
    this.initEntityForm();
    this.initEntityAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.entityForm.get('description') as FormControl;
  }

  get hostname(): UntypedFormControl {
    return this.entityForm.get('hostname') as FormControl;
  }

  get port(): UntypedFormControl {
    return this.entityForm.get('port') as FormControl;
  }

  get username(): UntypedFormControl {
    return this.entityForm.get('username') as FormControl;
  }

  get password(): UntypedFormControl {
    return this.entityForm.get('password') as FormControl;
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
      name: [null, [Validators.required, Validators.maxLength(255)]],
      description: [null, [Validators.maxLength(1024)]],
      hostname: ['', [Validators.required]],
      port: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  setFormValuesToSelectedEntity(formValue: Proxy): void {
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

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
