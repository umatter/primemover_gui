import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';

import { Queue } from '@app/queue/model/queue';
import { QueueService } from '@app/entity/service';
import { TimezoneService } from '@shared/service/timezone.service';
import { fadeIn } from '@shared/animation/trigger';

/**
 * Slice B — workspace-native "New run" panel (docs/specs/runs-and-bots.md §5).
 *
 * Creates a Run (Queue) scoped to a Bot (crawler). The operator names the run and picks a
 * start date/time + timezone; the UTC offset is resolved from the timezone so the runner
 * schedules it correctly. Jobs are composed into the run afterwards (Slice C).
 */
@Component({
  selector: 'app-run-create',
  templateUrl: './run-create.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgIf, NgForOf, AsyncPipe],
  animations: [fadeIn]
})
export class RunCreateComponent implements OnInit, OnDestroy {
  @Input({ required: true }) crawlerId!: number;
  @Input() crawlerName?: string;
  @Output() created = new EventEmitter<Queue>();
  @Output() closed = new EventEmitter<void>();

  readonly defaultTimezone = 'Europe/Berlin';

  form: FormGroup;
  submitting = false;
  errorKey: string | null = null;
  timezones$: Observable<string[]>;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private queueService: QueueService,
    private timezoneService: TimezoneService
  ) {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      description: [''],
      start_at: [null, [Validators.required]],
      timezone: [this.defaultTimezone, [Validators.required]],
      timezone_utc_offset: [null, [Validators.required]]
    });
    this.timezones$ = this.timezoneService.getList();
  }

  ngOnInit(): void {
    // Resolve the offset for the default timezone so a run can be scheduled immediately.
    this.resolveOffset(this.defaultTimezone);
  }

  onTimezoneChange(): void {
    const tz = this.form.get('timezone')?.value;
    if (tz) this.resolveOffset(tz);
  }

  private resolveOffset(timezone: string): void {
    this.subscriptions.add(
      this.timezoneService.getDetail(timezone).subscribe({
        next: (detail) => this.form.patchValue({ timezone_utc_offset: detail?.utc_offset ?? null }),
        error: () => this.form.patchValue({ timezone_utc_offset: null })
      })
    );
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.form.get(controlName);
    return !!(c?.touched && c?.invalid && c?.getError(errorName));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.errorKey = null;

    // The API requires a non-empty description; fall back to the run name when left blank.
    const value = this.form.value;
    const payload = {
      ...value,
      description: (value.description || '').trim() || value.name,
      crawler_id: this.crawlerId
    };

    this.subscriptions.add(
      this.queueService.add(payload as unknown as Queue).subscribe({
        next: (run: Queue) => {
          this.submitting = false;
          this.created.emit(run);
        },
        error: () => {
          this.submitting = false;
          this.errorKey = 'workspace.runPanel.error';
        }
      })
    );
  }

  cancel(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
