import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProxyFormValues } from '../model/proxy-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeProxyCreateRequested, updateProxyCreateValues } from '../../store/proxy.actions';
import { Router } from '@angular/router';
import { selectProxyFormValid } from '../../store/proxy.selectors';

@Component({
  selector: 'app-proxy-create',
  templateUrl: './proxy-create.component.html',
  animations: [fadeIn]
})
export class ProxyCreateComponent implements OnInit, OnDestroy {
  proxyForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;

  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router) { }

  get name(): string | null {
    return this.proxyForm.get('name')?.value;
  }
  get description(): string | null {
    return this.proxyForm.get('description')?.value;
  }
  get hostName(): string | null {
    return this.proxyForm.get('hostName')?.value;
  }
  get port(): string | null {
    return this.proxyForm.get('port')?.value;
  }
  get username(): string | null {
    return this.proxyForm.get('username')?.value;
  }
  get password(): string | null {
    return this.proxyForm.get('password')?.value;
  }

  ngOnInit(): void {
    this.formValid$ = this.store.pipe(select(selectProxyFormValid));
    this.proxyForm = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(255)]],
      description: [null, [Validators.maxLength(1024)]],
      hostName: ['', [Validators.required]],
      port: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      active: [1],
    });

    this.subscriptions.add(
      this.proxyForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: ProxyFormValues) => {
        this.store.dispatch(
          updateProxyCreateValues({
            name: formValue.name,
            active: true,
            description: formValue.description,
            hostName: formValue.hostName,
            port: formValue.port,
            username: formValue.username,
            password: formValue.password,
            valid: this.proxyForm.valid
          })
        );
      })
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.proxyForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.proxyForm.get(controlName)?.touched &&
      this.proxyForm.get(controlName)?.invalid &&
      this.proxyForm.get(controlName)?.getError(errorName)
    );
  }

  saveProxy(): void {
    this.store.dispatch(completeProxyCreateRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
