import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgentFormValues } from '../model/agent-form-values';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { completeAgentCreateRequested, updateAgentCreateValues } from '../../store/agent.actions';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
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

  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router, private agentDialog: MatDialogRef<AgentCreateComponent>) { }

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
    // this.formValid$ = this.store.pipe(select(selectAgentFormValid));
    this.agentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      identification: ['', [Validators.required]],
      multilogin_id: ['', [Validators.required]],
      multilogin_profile: ['', [Validators.required]],
      location: ['', [Validators.required]],
      active: [1],
    });

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
            active: formValue.active,
            valid: this.agentForm.valid

          })
        );
      })
    );
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

  saveAgent(): void {
    this.store.dispatch(completeAgentCreateRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
