import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';

import { Job } from '@app/job/model/Job';
import { Queue } from '@app/queue/model/queue';
import { Behavior } from '@app/behavior/behavior';
import { BehaviorService, JobService, QueueService } from '@app/entity/service';
import { JobFieldSchema, JobTypeSchema, JOB_TYPE_OPTIONS, JOB_TYPE_SCHEMAS } from '@app/enum/job-type-schema';
import { normalizeStatus, QueueStatusEnum } from '@app/queue/status/status.enum';
import { StatusComponent } from '@app/queue/status/status.component';
import { fadeIn } from '@shared/animation/trigger';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { JobBehavioursComponent } from '../job-behaviours/job-behaviours.component';

/** Terminal-state tally over a run's jobs, computed from the jobs this screen already holds. */
export interface JobOutcomeCounts {
  total: number;
  succeeded: number;
  warning: number;
  failed: number;
  skipped: number;
  running: number;
}

/**
 * Slice C — Run composer: authors the ordered Job sequence of a Run (Queue) at
 * /experiments/:id/bots/:botId/runs/:runId. A job is added with a type AND its type-specific
 * parameters (which are stored as Behaviours). Jobs can be reordered, toggled, or removed; the
 * per-job Behaviours modal (Slice D) edits the same parameters afterward.
 */
@Component({
  selector: 'app-run-composer',
  templateUrl: './run-composer.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgIf,
    NgForOf,
    NgClass,
    RouterLink,
    TranslateModule,
    LoadingSpinnerComponent,
    JobBehavioursComponent,
    StatusComponent
  ],
  animations: [fadeIn]
})
export class RunComposerComponent implements OnInit, OnDestroy {
  run$!: Observable<Queue | undefined>;
  jobs$!: Observable<Job[]>;
  isLoading$ = this.jobService.loading$;

  /** Live, order-sorted snapshot of this run's jobs — drives ordering math. */
  jobs: Job[] = [];

  /**
   * Outcome tally over `jobs`. This screen is where a user lands to ask "why did my run
   * fail", and until 2026-08-27 it showed no job status and no error text at all — so the
   * one job that degraded or failed inside an otherwise green run was invisible here.
   */
  counts: JobOutcomeCounts = { total: 0, succeeded: 0, warning: 0, failed: 0, skipped: 0, running: 0 };

  experimentId!: number;
  botId!: number;
  runId!: number;

  addForm: FormGroup;
  /** Dynamic controls for the selected type's parameter fields (each becomes a Behaviour). */
  fieldsForm: FormGroup;
  currentFields: JobFieldSchema[] = [];
  behavioursJob: Job | null = null;
  addErrorKey: string | null = null;

  readonly jobTypes: JobTypeSchema[] = JOB_TYPE_OPTIONS;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private jobService: JobService,
    private behaviorService: BehaviorService,
    private queueService: QueueService
  ) {
    this.addForm = this.fb.group({
      name: [null, [Validators.required]],
      type: [null, [Validators.required]]
    });
    this.fieldsForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.run$ = this.route.paramMap.pipe(
      switchMap((params) => {
        this.experimentId = Number(params.get('id'));
        this.botId = Number(params.get('botId'));
        this.runId = Number(params.get('runId'));
        this.loadJobs();
        return this.queueService.getByKey(this.runId);
      })
    );

    this.jobs$ = this.jobService.entities$.pipe(
      map((jobs) => jobs.filter((j) => Number(j.queue_id) === Number(this.runId)).sort((a, b) => a.order - b.order))
    );
    this.subscriptions.add(
      this.jobs$.subscribe((jobs) => {
        this.jobs = jobs;
        this.counts = this.tally(jobs);
      })
    );
  }

  private loadJobs(): void {
    this.jobService.getWithQuery({ ['filter[queue]']: String(this.runId) });
  }

  private tally(jobs: Job[]): JobOutcomeCounts {
    const counts: JobOutcomeCounts = {
      total: jobs.length,
      succeeded: 0,
      warning: 0,
      failed: 0,
      skipped: 0,
      running: 0
    };
    for (const job of jobs) {
      switch (normalizeStatus(job.status_code)) {
        case QueueStatusEnum.SUCCESS:
          counts.succeeded++;
          break;
        case QueueStatusEnum.WARNING:
          counts.warning++;
          break;
        case QueueStatusEnum.FAILURE:
          counts.failed++;
          break;
        case QueueStatusEnum.SKIPPED:
          counts.skipped++;
          break;
        case QueueStatusEnum.RUNNING:
          counts.running++;
          break;
        default:
          break;
      }
    }
    return counts;
  }

  /** True once any job has reported a terminal or running state worth showing. */
  get hasJobOutcomes(): boolean {
    const c = this.counts;
    return c.succeeded + c.warning + c.failed + c.skipped + c.running > 0;
  }

  /** The runner's diagnostic for a job, or '' (never the literal 'null'). */
  jobMessage(job: Job): string {
    return (job.status_message ?? '').toString().trim();
  }

  /** The run's own diagnostic, or ''. */
  runMessage(run: Queue): string {
    return (run.status_message ?? '').toString().trim();
  }

  /** Rebuild the parameter sub-form when the job type changes. */
  onTypeChange(): void {
    const type = this.addForm.get('type')?.value;
    const schema = type ? JOB_TYPE_SCHEMAS[type] : undefined;
    this.currentFields = schema?.fields ?? [];

    const group: Record<string, unknown> = {};
    for (const f of this.currentFields) {
      group[f.name] = [f.default ?? '', f.required ? [Validators.required] : []];
    }
    this.fieldsForm = this.fb.group(group);

    // Suggest a label from the type's display name when the user hasn't set one.
    if (schema && !this.addForm.get('name')?.value) {
      this.addForm.patchValue({ name: schema.displayName });
    }
  }

  private nextOrder(): number {
    return this.jobs.length ? Math.max(...this.jobs.map((j) => j.order || 0)) + 1 : 1;
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.addForm.get(controlName);
    return !!(c?.touched && c?.invalid && c?.getError(errorName));
  }

  fieldHasError(fieldName: string): boolean {
    const c = this.fieldsForm.get(fieldName);
    return !!(c?.touched && c?.invalid && c?.getError('required'));
  }

  addJob(): void {
    if (this.addForm.invalid || this.fieldsForm.invalid) {
      this.addForm.markAllAsTouched();
      this.fieldsForm.markAllAsTouched();
      return;
    }

    // The API links jobs (previous_job_id); the runner sequences by order and rebuilds the chain
    // at runtime, so we chain to the current last job (null for the first).
    const last = this.jobs.length ? this.jobs[this.jobs.length - 1] : null;
    const jobPayload = {
      ...this.addForm.value,
      queue_id: this.runId,
      order: this.nextOrder(),
      previous_job_id: last ? last.id : null,
      active: 1
    };

    // Every filled field becomes a Behaviour on the new job.
    const fieldValues = this.fieldsForm.value as Record<string, unknown>;
    const behaviours = this.currentFields
      .map((f) => ({ name: f.name, value: fieldValues[f.name], description: f.description ?? '' }))
      .filter((b) => b.value !== null && b.value !== undefined && String(b.value).trim() !== '');

    this.addErrorKey = null;
    this.subscriptions.add(
      this.jobService
        .add(jobPayload as unknown as Job)
        .pipe(
          switchMap((job: Job) => {
            if (!behaviours.length) return of(job);
            return forkJoin(
              behaviours.map((b) =>
                this.behaviorService.add({
                  name: b.name,
                  value: String(b.value),
                  description: b.description,
                  active: true,
                  job_id: job.id
                } as unknown as Behavior)
              )
            ).pipe(
              map(() => job),
              // A behaviour hiccup must not hide the job that was already created.
              catchError(() => of(job))
            );
          })
        )
        .subscribe({
          next: () => {
            this.resetAddForm();
            this.loadJobs();
          },
          error: () => {
            this.addErrorKey = 'workspace.composer.addError';
            this.loadJobs();
          }
        })
    );
  }

  private resetAddForm(): void {
    this.addForm.reset();
    this.fieldsForm = this.fb.group({});
    this.currentFields = [];
  }

  moveUp(job: Job): void {
    const idx = this.jobs.findIndex((j) => j.id === job.id);
    if (idx <= 0) return;
    const reordered = [...this.jobs];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    this.persistOrder(reordered);
  }

  moveDown(job: Job): void {
    const idx = this.jobs.findIndex((j) => j.id === job.id);
    if (idx < 0 || idx >= this.jobs.length - 1) return;
    const reordered = [...this.jobs];
    [reordered[idx + 1], reordered[idx]] = [reordered[idx], reordered[idx + 1]];
    this.persistOrder(reordered);
  }

  /**
   * Renumber jobs to their position (1-based) and persist any whose order changed. Position-based
   * numbering is robust even when existing orders collide (e.g. legacy duplicate `order` values),
   * unlike swapping raw order values. Reloads afterwards so the shown sequence matches the server.
   */
  private persistOrder(orderedJobs: Job[]): void {
    const changed = orderedJobs
      .map((job, i) => ({ job, order: i + 1 }))
      .filter((x) => x.job.order !== x.order);
    if (!changed.length) return;
    this.subscriptions.add(
      forkJoin(
        changed.map((x) => this.jobService.update({ ...x.job, order: x.order } as Job).pipe(catchError(() => of(null))))
      ).subscribe(() => this.loadJobs())
    );
  }

  toggleActive(job: Job): void {
    const active = job.active ? 0 : 1;
    this.subscriptions.add(this.jobService.update({ ...job, active } as unknown as Job).subscribe());
  }

  removeJob(job: Job): void {
    this.subscriptions.add(this.jobService.delete(job.id).subscribe());
  }

  editBehaviours(job: Job): void {
    this.behavioursJob = job;
  }

  closeBehaviours(): void {
    this.behavioursJob = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
