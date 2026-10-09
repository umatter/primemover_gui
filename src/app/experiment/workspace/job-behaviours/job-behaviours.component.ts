import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, Subscription } from 'rxjs';

import { Behavior } from '@app/behavior/behavior';
import { Job } from '@app/job/model/Job';
import { BehaviorService } from '@app/entity/service';
import { fadeIn } from '@shared/animation/trigger';
import { JobFieldSchema } from '@app/enum/job-type-schema';
import { inSchema, missingRequired, unsetFields } from '../setup/job-settings';

/**
 * Slice D — per-job Behaviours editor (docs/specs/runs-and-bots.md §5).
 *
 * A Job's type-specific parameters are expressed as Behaviours ({name, value, active}).
 * This modal lists a job's behaviours and lets the operator add / toggle / remove them.
 * Opened from the run composer (Slice C) for a given job.
 */
@Component({
  selector: 'app-job-behaviours',
  templateUrl: './job-behaviours.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgIf, NgForOf, NgClass, AsyncPipe],
  animations: [fadeIn]
})
export class JobBehavioursComponent implements OnInit, OnDestroy {
  @Input({ required: true }) job!: Job;
  @Output() closed = new EventEmitter<void>();

  behaviours$!: Observable<Behavior[]>;
  isLoading$ = this.behaviorService.loading$;

  addForm: FormGroup;

  /**
   * F4b. The schema field the add form is filling, when its name is one: drives the value
   * select and the help text. Null for a free name.
   */
  selectedField: JobFieldSchema | null = null;

  /** This job's behaviours as last emitted, for the schema rules. */
  private current: Behavior[] = [];

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private behaviorService: BehaviorService
  ) {
    this.addForm = this.fb.group({
      name: [null, [Validators.required]],
      value: [null, [Validators.required]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadBehaviours();
    this.behaviours$ = this.behaviorService.entities$.pipe(
      map((all) => all.filter((b) => Number(b.job_id) === Number(this.job.id)))
    );
    this.subscriptions.add(this.behaviours$.subscribe((list) => (this.current = list)));
  }

  /** The job type's settings with no behaviour yet, required first. [] for an unknown type. */
  get suggestions(): JobFieldSchema[] {
    return unsetFields(this.job.type, this.current);
  }

  /** Required settings with no active behaviour — what the runner would miss. */
  get missingRequired(): string[] {
    return missingRequired(this.job.type, this.current);
  }

  pickField(field: JobFieldSchema): void {
    this.selectedField = field;
    this.addForm.patchValue({ name: field.name, value: field.default ?? field.options?.[0] ?? null });
  }

  /** A typed name that matches a schema field gets that field's options and help. */
  onNameInput(): void {
    const name = String(this.addForm.value.name ?? '').trim();
    this.selectedField = this.suggestions.find((f) => f.name === name) ?? null;
  }

  /** True only when the type is known and does not list this name. */
  notInSchema(behaviour: Behavior): boolean {
    return inSchema(this.job.type, behaviour.name) === false;
  }

  private loadBehaviours(): void {
    this.behaviorService.getWithQuery({ ['filter[job]']: String(this.job.id) });
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.addForm.get(controlName);
    return !!(c?.touched && c?.invalid && c?.getError(errorName));
  }

  addBehaviour(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.addForm.value,
      job_id: this.job.id,
      active: true
    };
    this.subscriptions.add(
      this.behaviorService.add(payload as unknown as Behavior).subscribe(() => {
        this.addForm.reset();
        this.selectedField = null;
        this.loadBehaviours();
      })
    );
  }

  toggleActive(behaviour: Behavior): void {
    this.subscriptions.add(
      this.behaviorService.update({ ...behaviour, active: !behaviour.active } as Behavior).subscribe()
    );
  }

  removeBehaviour(behaviour: Behavior): void {
    this.subscriptions.add(this.behaviorService.delete(behaviour.id).subscribe());
  }

  cancel(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
