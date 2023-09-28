import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Agent } from '@app/agent/model/agent';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-agent-form',
  templateUrl: './agent-form.component.html',
  imports: [ReactiveFormsModule, TranslateModule, AsyncPipe, NgClass, NgIf],
  standalone: true
})
export class AgentFormComponent implements OnDestroy, OnInit {
  @Input() agent$: Observable<Agent>;
  @Input() agent: Agent;
  @Output() saveClicked = new EventEmitter<Agent>();
  @Output() cancelClicked = new EventEmitter<void>();
  agentForm: FormGroup;
  subscriptions = new Subscription();

  constructor(private store: Store, private formBuilder: FormBuilder, private router: Router) {
    this.initAgentForm();
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

  ngOnInit(): void {
    this.initAgentEdit();
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.agentForm.get(controlName)?.touched &&
      this.agentForm.get(controlName)?.invalid &&
      this.agentForm.get(controlName)?.getError(errorName)
    );
  }

  initAgentForm(): void {
    this.agentForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      identification: [],
      multilogin_id: [],
      multilogin_profile: [],
      location: [],
      active: [true]
    });
  }

  onCancel(): void {
    this.cancelClicked.emit();
    this.agentForm.reset();
    this.router.navigate(['/agents']).then();
  }

  onSave(): void {
    this.saveClicked.emit(this.agentForm.value);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initAgentEdit(): void {
    this.agentForm.patchValue(this.agent);
  }
}
