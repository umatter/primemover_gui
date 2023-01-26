import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ProxyFormValues } from '../model/proxy-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { completeProxyCreateRequested, updateProxyCreateValues } from '../../store/proxy.actions';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProxyService } from '../../service/proxy.service';

@Component({
  selector: 'app-proxy-create',
  templateUrl: './proxy-create.component.html',
  animations: [fadeIn]
})
export class ProxyCreateComponent implements OnInit, OnDestroy {
  proxyForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;
  selected = false;
  proxyLoader = false;
  proxies: any;
  proxyCtrl = new FormControl('',[Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private proxy: ProxyService,
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router,
    private proxyDialog: MatDialogRef<ProxyCreateComponent>
  ) {}

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
    this.proxyForm = this.formBuilder.group({
      name: [null, [Validators.required, Validators.maxLength(255)]],
      description: [null, [Validators.maxLength(1024)]],
      hostName: ['', [Validators.required]],
      port: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      id: [''],
      active: [1]
    });
    this.isPopup = this.data.isPopup;

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
            password: formValue.password
          })
        );
      })
    );

    this.proxyCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search.length >= 2) {
        this.proxyLoader = true;
        this.proxy.search(search).subscribe(
          (result: any) => {
            this.proxies = result.data;
            this.proxyLoader = false;
          },
          (error) => {
            this.proxyLoader = false;
          }
        );
      }
      this.proxyForm.controls['name'].setValue(search);
    });
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

  autoCompleteHasError(errorName: string) {
    return this.proxyCtrl?.touched && this.proxyCtrl?.invalid && this.proxyCtrl.getError(errorName);
  }

  saveProxy(): void {
    if (!this.proxyForm.valid) {
      return;
    }
    if (!this.selected) {
      this.store.dispatch(completeProxyCreateRequested());
    }
    this.onClose(true);
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.proxyDialog.close(this.proxyForm.value);
    } else {
      this.router.navigate(['proxies']);
    }
  }

  setControlValue(item: any) {
    this.proxyForm.controls['id'].setValue(item.id);
    this.proxyForm.controls['name'].setValue(item.name);
    this.proxyForm.controls['active'].setValue(item.active);
    this.proxyForm.controls['description'].setValue(item.description);
    this.proxyForm.controls['hostName'].setValue(item.hostname);
    this.proxyForm.controls['port'].setValue(item.port);
    this.proxyForm.controls['username'].setValue(item.username);
    this.proxyForm.controls['password'].setValue(item.password);
    this.selected = true;
  }

  reset() {
    this.proxyForm.reset();
    this.proxyCtrl.setValue(null);
    this.selected = false;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
