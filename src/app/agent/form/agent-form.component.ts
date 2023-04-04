import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { Agent } from '@app/agent/model/agent';
import { Store } from '@ngrx/store';
import { AgentService } from '@app/entity/service';
import { updateAgentCreateValues } from '@app/agent/store/agent.actions';

@Component({
  selector: 'app-agent-form',
  templateUrl: './agent-form.component.html'
})
export class AgentFormComponent implements OnDestroy {
  @Output() saveClicked = new EventEmitter<Agent>();
  @Output() cancelClicked = new EventEmitter<void>();
  agentForm: FormGroup;
  filteredAgents$: Observable<Agent[]>;
  showAutocompletion: boolean;
  subscriptions = new Subscription();

  constructor(private store: Store, private formBuilder: FormBuilder, private agentService: AgentService) {
    this.filteredAgents$ = agentService.filteredEntities$;
    this.initAgentForm();
    this.initAgentAutocompletion();
  }

  get name(): UntypedFormControl {
    return this.agentForm.get('name') as FormControl;
  }

  get description(): UntypedFormControl {
    return this.agentForm.get('description') as FormControl;
  }

  get identification(): UntypedFormControl {
    return this.agentForm.get('identification') as FormControl;
  }

  get multiLoginId(): UntypedFormControl {
    return this.agentForm.get('multiLoginId') as FormControl;
  }

  get multiLoginProfile(): UntypedFormControl {
    return this.agentForm.get('multiLoginProfile') as FormControl;
  }

  get location(): UntypedFormControl {
    return this.agentForm.get('location') as FormControl;
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.agentForm.get(controlName)?.touched &&
      this.agentForm.get(controlName)?.invalid &&
      this.agentForm.get(controlName)?.getError(errorName)
    );
  }

  initAgentAutocompletion(): void {
    this.agentService.getAll();
    this.subscriptions.add(
      this.name.valueChanges.pipe().subscribe((search) => {
        this.showAutocompletion = true;
        this.agentService.setFilter(search);
      })
    );
  }

  initAgentForm(): void {
    this.agentForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      identification: [],
      multiLoginId: [],
      multiLoginProfile: [],
      location: [],
      active: [true]
    });

    this.subscriptions.add(
      this.agentForm.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((formValue: Agent) => {
        this.store.dispatch(updateAgentCreateValues(formValue));
      })
    );
  }

  setFormValuesToSelectedAgent(formValue: Agent): void {
    const agentFormValues = {
      ...formValue,
      multiLoginProfile: formValue.multilogin_profile,
      multiLoginId: formValue.multilogin_id,
      active: true
    };

    this.showAutocompletion = false;
    this.agentForm.patchValue(agentFormValues);
  }

  onCancel(): void {
    this.cancelClicked.emit();
    this.reset();
  }

  onSave(): void {
    this.saveClicked.emit(this.agentForm.value);
    this.reset();
  }

  reset() {
    this.agentForm.reset();
    this.name.setValue(null);
    this.showAutocompletion = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
