import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
import { Proxy } from '@app/proxy/model/proxy';
import { ProxyService } from '@app/entity/service';
import { Router } from '@angular/router';
import { ProxyType, usernamePasswortRequiredFor } from '@app/enum/proxy-type.enum';
import { TranslateModule } from '@ngx-translate/core';
import { AutocompleteSelectComponent } from '@shared/autocomplete-select/autocomplete-select.component';
import { HeroiconTrashComponent } from '@shared/icon/heroicon-trash/heroicon-trash.component';
import { NgClass, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-proxy-form',
  templateUrl: './proxy-form.component.html',
  animations: [fadeIn],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    AutocompleteSelectComponent,
    HeroiconTrashComponent,
    NgIf,
    NgForOf,
    NgClass
  ],
  standalone: true
})
export class ProxyFormComponent implements OnDestroy, OnInit {
  @Input() proxy$: Observable<Proxy>;
  @Input() proxy: Proxy;
  @Output() saveClicked = new EventEmitter<Proxy>();
  @Output() cancelClicked = new EventEmitter<void>();
  entityForm: FormGroup;
  subscriptions = new Subscription();
  filteredProxies$: Observable<Proxy[]>;
  showAutocompletion: boolean;
  proxyTypes = Object.values(ProxyType);
  protected readonly ProxyType = ProxyType;
  protected readonly usernamePasswortRequiredFor = usernamePasswortRequiredFor;

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private entityService: ProxyService,
    private router: Router
  ) {
    this.filteredProxies$ = entityService.filteredEntities$;
    this.initEntityForm();
    this.initEntityAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.entityForm.get('name') as FormControl;
  }

  get type(): UntypedFormControl {
    return this.entityForm.get('type') as FormControl;
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
      id: [null],
      name: [null, [Validators.required, Validators.maxLength(255)]],
      type: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      hostname: [null, [Validators.required]],
      port: [null, [Validators.required]],
      username: [null],
      password: [null]
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
    if (this.entityForm.get('id').value) {
      this.entityService.update(this.entityForm.value);
    } else {
      this.entityService.add(this.entityForm.value);
    }

    this.reset();
  }

  onChangeProxyType(): void {
    this.username.setValue(null);
    this.password.setValue(null);
    this.username?.clearValidators();
    this.password?.clearValidators();

    if (usernamePasswortRequiredFor.includes(this.type.value)) {
      this.username?.setValidators([Validators.required]);
      this.password?.setValidators([Validators.required]);
    }

    this.username?.updateValueAndValidity();
    this.password?.updateValueAndValidity();
  }

  reset() {
    this.entityForm.reset();
    this.name.setValue(null);
    this.showAutocompletion = false;
    this.router.navigate(['/proxies']).then();
  }

  initProxyEdit(): void {
    this.entityForm.patchValue(this.proxy);
    this.showAutocompletion = false;
  }

  ngOnInit(): void {
    this.initProxyEdit();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
