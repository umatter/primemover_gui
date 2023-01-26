import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AgentFormValues } from '../model/agent-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { completeAgentCreateRequested, updateAgentCreateValues } from '../../store/agent.actions';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AgentService } from '../../service/agent.service';
// import { selectAgentFormValid } from '../../store/agent.selectors';

@Component({
  selector: 'app-agent-create',
  templateUrl: './agent-create.component.html',
  animations: [fadeIn]
})
export class AgentCreateComponent implements OnInit, OnDestroy {
  agentForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  isPopup = false;
  selected = false;
  agents: any;
  agentCtrl = new FormControl('',[Validators.required]);
  agentLoader: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store,
    private agent: AgentService,
    private formBuilder: FormBuilder,
    public router: Router,
    private agentDialog: MatDialogRef<AgentCreateComponent>
  ) {}

  get name(): string | null {
    return this.agentForm.get('name')?.value;
  }

  get description(): string | null {
    return this.agentForm.get('description')?.value;
  }
  get identification(): string | null {
    return this.agentForm.get('identification')?.value;
  }

  get multilogin_id(): string | null {
    return this.agentForm.get('multilogin_id')?.value;
  }

  get multilogin_profile(): string | null {
    return this.agentForm.get('multilogin_profile')?.value;
  }

  get location(): string | null {
    return this.agentForm.get('location')?.value;
  }

  ngOnInit(): void {
    this.agentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      identification: ['', [Validators.required]],
      multilogin_id: ['', [Validators.required]],
      multilogin_profile: ['', [Validators.required]],
      location: ['', [Validators.required]],
      id: [''],
      active: [1]
    });
    this.isPopup = this.data.isPopup;

    this.subscriptions.add(
      this.agentForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: AgentFormValues) => {
        this.store.dispatch(
          updateAgentCreateValues({
            name: formValue.name,
            description: formValue.description,
            identification: formValue.identification,
            multilogin_id: formValue.multilogin_id,
            multilogin_profile: formValue.multilogin_profile,
            location: formValue.location,
            active: formValue.active
          })
        );
      })
    );

    this.agentCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search.length >= 2) {
        this.agentLoader = true;
        this.agent.search(search).subscribe(
          (result: any) => {
            this.agents = result.data;
            this.agentLoader = false;
          },
          (error) => {
            this.agentLoader = false;
          }
        );
      }
      this.agentForm.controls['name'].setValue(search);
    });
  }

  reset() {
    this.agentForm.reset();
    this.agentCtrl.setValue(null);
    this.selected = false;
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.agentForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.agentForm.get(controlName)?.touched &&
      this.agentForm.get(controlName)?.invalid &&
      this.agentForm.get(controlName)?.getError(errorName)
    );
  }

  autoCompleteHasError(errorName: string) {
    return this.agentCtrl?.touched && this.agentCtrl?.invalid && this.agentCtrl.getError(errorName);
  }

  saveAgent(): void {
    if (!this.agentForm.valid) {
      return;
    }
    if (!this.selected) {
      this.agentForm.controls['active'].setValue(1);
      this.store.dispatch(completeAgentCreateRequested());
    }
    this.onClose(true);
  }

  setControlValue(item: any) {
    this.agentForm.controls['id'].setValue(item.id);
    this.agentForm.controls['name'].setValue(item.name);
    this.agentForm.controls['description'].setValue(item.description);
    this.agentForm.controls['identification'].setValue(item.identification);
    this.agentForm.controls['multilogin_id'].setValue(item.multilogin_id);
    this.agentForm.controls['multilogin_profile'].setValue(item.multilogin_profile);
    this.agentForm.controls['location'].setValue(item.location);
    this.selected = true;
  }

  onClose(close: boolean) {
    if (this.isPopup) {
      this.agentDialog.close(this.agentForm.value);
    } else {
      this.router.navigate(['agents']);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
