import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  EMPTY,
  expand,
  forkJoin,
  map,
  Observable,
  of,
  shareReplay,
  startWith,
  Subscription,
  switchMap,
  take
} from 'rxjs';

import { Job } from '@app/job/model/Job';
import { Queue, queueJobRollup } from '@app/queue/model/queue';
import { Behavior } from '@app/behavior/behavior';
import { BehaviorService, JobService, QueueService } from '@app/entity/service';
import { JobFieldSchema, JobTypeSchema, JOB_TYPE_OPTIONS, JOB_TYPE_SCHEMAS } from '@app/enum/job-type-schema';
import { missingRequired } from '../setup/job-settings';
import { QueueStatusEnum, statusOrUnknown, UNKNOWN_STATUS } from '@app/queue/status/status.enum';
import { StatusComponent } from '@app/queue/status/status.component';
import { fadeIn } from '@shared/animation/trigger';
import { Meta } from '@shared/pagination/model';
import { anyRunning, isRunningStatus, livenessOn$, livenessTicks } from '@shared/model/liveness';
import { RunAlarm, RunAlarmState, RunTransitionWatcher } from '@shared/model/run-transition';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { VisibilityService } from '@shared/service/visibility.service';
import { JobBehavioursComponent } from '../job-behaviours/job-behaviours.component';
import { DecisionBadgeComponent } from '@app/job/decision/decision-badge.component';
import { DecisionReportComponent } from '@app/job/decision/decision-report.component';
import { decisionBadgeKind, hasDecisionReport, isDecisionJobType } from '@app/job/model/decision';
import { JobDiagnosticsComponent } from '@app/job/diagnostics/job-diagnostics.component';

/** Terminal-state tally over a run's jobs, computed from the jobs this screen already holds. */
export interface JobOutcomeCounts {
  total: number;
  succeeded: number;
  warning: number;
  failed: number;
  skipped: number;
  running: number;
  /**
   * Jobs whose `status_code` is present but is none of the five canonical values (nor a
   * known legacy alias). The API validates nothing on that field, so this is reachable.
   *
   * Before this bucket existed such a job fell through the `switch` into nothing while
   * still counting towards `total`, so the tally quietly disagreed with itself — "3
   * succeeded" out of a total of 4, with the fourth job's state never mentioned. The
   * contract's rule is that unknown is unknown: it must be shown, not dropped and not
   * folded into a benign bucket.
   *
   * A job with **no** `status_code` at all is a different thing — a step that has not run
   * yet, which is the normal state of every job in a run being composed — and is
   * deliberately not counted here. Turning "not started" into "unknown" would paint every
   * freshly-authored run with a warning it has not earned.
   */
  unknown: number;
  /**
   * Jobs whose decision `degraded` — a requested filter did not apply. Counted off the
   * verdict columns, **not** off `status_code`, because they answer different questions:
   * a job can be `success` and still have lost its treatment.
   */
  decisionDegraded: number;
  /**
   * Jobs whose bot was treated and produced control-arm data. The alarm.
   *
   * Only positives are counted. A zero here is not a clean bill of health — the columns
   * are nullable, so it also covers "no verdict was ever recorded".
   */
  treatmentLost: number;
}

/** `GET behaviors` caps `per_page` at this (BehaviorRepository::MAX_PER_PAGE). */
const BEHAVIOUR_PAGE = 500;

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
    StatusComponent,
    DecisionBadgeComponent,
    DecisionReportComponent,
    JobDiagnosticsComponent,
    NotificationComponent
  ],
  animations: [fadeIn]
})
export class RunComposerComponent implements OnInit, OnDestroy {
  run$!: Observable<Queue | undefined>;
  jobs$!: Observable<Job[]>;
  isLoading$ = this.jobService.loading$;

  /**
   * True while this run (or one of its jobs) is running: what {@link livenessTicks} polls
   * on. Also drives the small "live" marker, so the refresh is visible rather than
   * mysterious.
   */
  active$!: Observable<boolean>;
  /** True while polling is actually happening — running **and** the tab is visible. */
  live$!: Observable<boolean>;

  /**
   * The last alarm this screen raised, or null. Rendered as a toast.
   *
   * One at a time: two alarms in the same tick means the run both failed and lost its
   * treatment, and {@link RunTransitionWatcher} orders treatment loss first because that
   * is the one a status column cannot tell you.
   */
  alarm: RunAlarm | null = null;

  /** Live, order-sorted snapshot of this run's jobs — drives ordering math. */
  jobs: Job[] = [];

  /**
   * Outcome tally over `jobs`. This screen is where a user lands to ask "why did my run
   * fail", and until 2026-08-27 it showed no job status and no error text at all — so the
   * one job that degraded or failed inside an otherwise green run was invisible here.
   */
  counts: JobOutcomeCounts = {
    total: 0,
    succeeded: 0,
    warning: 0,
    failed: 0,
    skipped: 0,
    running: 0,
    unknown: 0,
    decisionDegraded: 0,
    treatmentLost: 0
  };

  experimentId!: number;
  botId!: number;
  runId!: number;

  addForm: FormGroup;
  /** Dynamic controls for the selected type's parameter fields (each becomes a Behaviour). */
  fieldsForm: FormGroup;
  currentFields: JobFieldSchema[] = [];
  behavioursJob: Job | null = null;

  /**
   * F4a. This run's behaviours by job id, from the shared ngrx-data cache — the behaviours
   * modal and add-job write through the same cache, so the flags follow their edits.
   * `behavioursKnown` stays false until a load succeeds: an API that cannot answer
   * `filter[queue]` must produce no flags, not a flag on every job.
   */
  behavioursKnown = false;
  private behavioursByJob = new Map<number, Behavior[]>();
  /** The run's behaviour load in flight; a new run (or a re-read) replaces it. */
  private behaviourLoad = new Subscription();
  addErrorKey: string | null = null;

  readonly jobTypes: JobTypeSchema[] = JOB_TYPE_OPTIONS;

  private subscriptions = new Subscription();

  /**
   * Drives a re-read of the run and its jobs. Every poll tick pushes here rather than
   * calling the services directly, so the template's `run$` — which is what actually
   * renders the status pill — is refreshed by the same mechanism.
   */
  private readonly refresh$ = new BehaviorSubject<number>(0);
  private refreshCount = 0;
  private readonly transitions = new RunTransitionWatcher();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private jobService: JobService,
    private behaviorService: BehaviorService,
    private queueService: QueueService,
    private visibility: VisibilityService
  ) {
    this.addForm = this.fb.group({
      name: [null, [Validators.required]],
      type: [null, [Validators.required]],
      // F6: what this step is for. Optional; the runner does not read it.
      description: ['']
    });
    this.fieldsForm = this.fb.group({});
  }

  ngOnInit(): void {
    // `refresh$` is part of the source so a poll tick re-reads the run itself, not only
    // its jobs: a run that finished while this screen was open must stop saying "Running".
    // `shareReplay` because three consumers (the template, the liveness gate and the
    // transition watcher) read this stream and each subscription would otherwise be its
    // own GET.
    this.run$ = combineLatest([this.route.paramMap, this.refresh$]).pipe(
      switchMap(([params]) => {
        this.experimentId = Number(params.get('id'));
        this.botId = Number(params.get('botId'));
        const runId = Number(params.get('runId'));
        if (runId !== this.runId) {
          // A different run: its predecessor's alarm history says nothing about this one.
          this.runId = runId;
          this.transitions.reset();
          this.alarm = null;
          this.loadBehaviours(true);
        }
        this.loadJobs();
        // A failed read must not kill the stream: `switchMap` would propagate the error to
        // every consumer, and the poll, the transition watcher and the template would all
        // stop for good after one transient 500. An unreadable run is "no run yet" — the
        // same thing the screen shows before the first response — and the next tick tries
        // again.
        return this.queueService.getByKey(this.runId).pipe(catchError(() => of(undefined)));
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.jobs$ = this.jobService.entities$.pipe(
      map((jobs) => jobs.filter((j) => Number(j.queue_id) === Number(this.runId)).sort((a, b) => a.order - b.order))
    );
    this.subscriptions.add(
      this.behaviorService.entities$.subscribe((behaviours) => {
        const byJob = new Map<number, Behavior[]>();
        for (const b of behaviours) {
          const id = Number(b.job_id);
          byJob.set(id, [...(byJob.get(id) ?? []), b]);
        }
        this.behavioursByJob = byJob;
      })
    );
    this.subscriptions.add(
      this.jobs$.subscribe((jobs) => {
        this.jobs = jobs;
        this.counts = this.tally(jobs);
      })
    );

    // `startWith(undefined)` so the gate has an answer before the run has loaded; a job
    // list that already shows a running job is reason enough to poll.
    this.active$ = combineLatest([this.run$.pipe(startWith(undefined)), this.jobs$]).pipe(
      map(([run, jobs]) => isRunningStatus(run?.status_code) || anyRunning(jobs)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.live$ = livenessOn$(this.active$, this.visibility.visible$);

    this.subscriptions.add(
      livenessTicks(this.active$, this.visibility.visible$).subscribe(() => this.refresh$.next(++this.refreshCount))
    );

    // Transition, not state: this screen re-reads the same run every 15 s, so anything
    // keyed on "is bad" would put the same toast up four times a minute.
    this.subscriptions.add(
      combineLatest([this.run$, this.jobs$]).subscribe(([run, jobs]) => {
        if (!run) return;
        const raised = this.transitions.observeState(
          Number(run.id),
          (run.name ?? '').toString(),
          this.alarmState(run, jobs)
        );
        if (raised.length) this.alarm = raised[0];
      })
    );
  }

  /**
   * The two alarm predicates for this run, right now.
   *
   * `treatmentLost` is taken from the run's rollup **or** from the jobs on screen: this
   * screen holds the jobs themselves, and their verdicts are the same evidence the
   * server's `jobs_treatment_lost_count` is counted from — but the run object arrives
   * from a different endpoint that may not carry the count at all. Either source saying
   * "lost" is enough; neither saying anything is unknown, and unknown never alarms.
   */
  private alarmState(run: Queue, jobs: Job[]): RunAlarmState {
    const lostJobs = jobs.filter((job) => decisionBadgeKind(job) === 'lost').length;
    return {
      failure: statusOrUnknown(run.status_code) === QueueStatusEnum.FAILURE,
      treatmentLost: (queueJobRollup(run, 'treatmentLost') ?? 0) > 0 || lostJobs > 0
    };
  }

  /** Dismiss the toast. The run keeps its state; only the interruption goes away. */
  dismissAlarm(): void {
    this.alarm = null;
  }

  /** Body text key for the toast, by alarm kind. */
  get alarmBodyKey(): string {
    return this.alarm?.kind === 'treatmentLost' ? 'runAlarm.treatmentLostBody' : 'runAlarm.failureBody';
  }

  /** Title key for the toast, by alarm kind. */
  get alarmTitleKey(): string {
    return this.alarm?.kind === 'treatmentLost' ? 'runAlarm.treatmentLostTitle' : 'runAlarm.failureTitle';
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
      running: 0,
      unknown: 0,
      decisionDegraded: 0,
      treatmentLost: 0
    };
    for (const job of jobs) {
      // The verdict is tallied independently of the status: a treatment can be lost on a
      // job that reported `success`, and counting it inside the status switch would make
      // the two mutually exclusive when they are orthogonal.
      const badge = decisionBadgeKind(job);
      if (badge === 'lost') counts.treatmentLost++;
      else if (badge === 'degraded') counts.decisionDegraded++;

      // Absent is "has not run yet", not "unknown"; only a job that reported *something*
      // can report something we do not understand.
      const raw = (job.status_code ?? '').toString().trim();
      if (!raw) continue;
      switch (statusOrUnknown(raw)) {
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
        case UNKNOWN_STATUS:
        default:
          counts.unknown++;
          break;
      }
    }
    return counts;
  }

  /** Whether to offer the decision-report expander for this job (see job index). */
  showsDecision(job: Job): boolean {
    return hasDecisionReport(job) || isDecisionJobType(job.type);
  }

  /** True once any job has reported a terminal or running state worth showing. */
  get hasJobOutcomes(): boolean {
    const c = this.counts;
    return c.succeeded + c.warning + c.failed + c.skipped + c.running + c.unknown > 0;
  }

  /**
   * Jobs this run holds according to the API, or `null` when it did not say.
   *
   * Read from the run's own rollup, not from `jobs.length`: this screen loads
   * `GET /jobs?filter[queue]=<id>` with no `per_page`, and the API paginates at 15. On
   * this box 131 of 635 runs hold more than that and 96 hold 284, so `jobs` is routinely
   * the first page of a much longer run.
   */
  runJobTotal(run: Queue | null | undefined): number | null {
    return queueJobRollup(run, 'total');
  }

  /** True when the jobs on screen are only part of the run — the tally must say so. */
  jobsTruncated(run: Queue | null | undefined): boolean {
    const total = this.runJobTotal(run);
    return total !== null && total > this.jobs.length;
  }

  /**
   * Whole-run treatment-lost count for the banner.
   *
   * The server's per-run rollup first — the same number {@link alarmState} already trusts
   * for the toast — falling back to what the loaded page shows when an older API sends no
   * rollup. Tallying the banner off `jobs` alone is how a 284-job run whose treatment was
   * lost on jobs 40-120 rendered **no alarm at all** on the one screen dedicated to it.
   *
   * `Math.max` rather than "rollup if present": both count the same set, the rollup covers
   * the whole run and the page covers part of it, so neither can legitimately exceed the
   * other and taking the larger can only ever fail towards showing the alarm.
   */
  treatmentLostTotal(run: Queue | null | undefined): number {
    return Math.max(queueJobRollup(run, 'treatmentLost') ?? 0, this.counts.treatmentLost);
  }

  /** Whole-run degraded-decision count for the banner. Same two sources, same reasoning. */
  decisionDegradedTotal(run: Queue | null | undefined): number {
    return Math.max(queueJobRollup(run, 'degraded') ?? 0, this.counts.decisionDegraded);
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
    const changed = orderedJobs.map((job, i) => ({ job, order: i + 1 })).filter((x) => x.job.order !== x.order);
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
    // The modal writes through the cache already; re-reading catches anything it could
    // not see, such as a behaviour another tab added.
    this.loadBehaviours();
  }

  /** Required settings of this job's type with no active behaviour; [] when unknowable. */
  missing(job: Job): string[] {
    if (!this.behavioursKnown) return [];
    return missingRequired(job.type, this.behavioursByJob.get(Number(job.id)) ?? []);
  }

  get incompleteJobs(): number {
    return this.jobs.filter((j) => this.missing(j).length > 0).length;
  }

  /**
   * Every behaviour of every job in the run (umatter/primemover_api#89), in pages of the
   * API's maximum, 500. A run can hold more (784 on ex63), so pages are read up to the
   * response's `meta.last_page` (a short page ends it when an older API sends no meta), and
   * the flags count as known only once the last one is in. `reset` (a different run) hides
   * them until then; a re-read of the same run keeps showing the cached state.
   */
  private loadBehaviours(reset = false): void {
    const runId = String(this.runId);
    const page = (n: number): Observable<{ n: number; last: boolean }> =>
      this.behaviorService
        .getWithQuery({ ['filter[queue]']: runId, per_page: String(BEHAVIOUR_PAGE), page: String(n) })
        .pipe(
          // The meta of this response: the reducer stores it before the result is emitted.
          switchMap((rows) =>
            this.behaviorService.pageMeta$.pipe(
              take(1),
              map((meta: Meta | null | undefined) => ({
                n,
                last: meta?.last_page ? n >= Number(meta.last_page) : rows.length < BEHAVIOUR_PAGE
              }))
            )
          )
        );

    if (reset) this.behavioursKnown = false;
    this.behaviourLoad.unsubscribe();
    this.behaviourLoad = page(1)
      .pipe(expand((p) => (p.last ? EMPTY : page(p.n + 1))))
      .subscribe({
        complete: () => (this.behavioursKnown = true),
        error: () => (this.behavioursKnown = false)
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.behaviourLoad.unsubscribe();
  }
}
