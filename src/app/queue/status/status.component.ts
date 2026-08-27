import { Component, Input } from '@angular/core';
import { normalizeStatus, QueueStatusEnum } from '@app/queue/status/status.enum';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

/** Translation keys this component knows how to render, by canonical status code. */
const LABEL_KEYS: Readonly<Record<string, string>> = {
  [QueueStatusEnum.FAILURE]: 'status.failure',
  [QueueStatusEnum.SUCCESS]: 'status.success',
  [QueueStatusEnum.WARNING]: 'status.warning',
  [QueueStatusEnum.RUNNING]: 'status.running',
  [QueueStatusEnum.SKIPPED]: 'status.skipped'
};

/**
 * The status pill for a job or a run.
 *
 * `status_message` used to be dropped into a native `title` tooltip only: invisible until
 * hover, unreachable on touch, not selectable and — because the whole pill was a plain
 * `<div>` — not announced by screen readers. Since 2026-08-27 the runner puts a real
 * diagnostic in that field, so it is shown as text wherever there is room
 * (`[showMessage]="true"`), always carried in the pill's `aria-label`, and kept in the
 * tooltip as a supplement.
 */
@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  imports: [NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, TranslateModule],
  standalone: true
})
export class StatusComponent {
  @Input() statusCode: string | number;
  /** Raw `status_message`. Bind with `[statusMessage]` — interpolation renders a null as "null". */
  @Input() statusMessage?: string | null;
  /** Render the message as text beside the pill. Off where a row has no room for it. */
  @Input() showMessage = false;

  protected readonly QueueStatusEnum = QueueStatusEnum;

  /** Canonical code, so legacy values ('skpped', 'failed') stop rendering as "Unknown". */
  get code(): string {
    return normalizeStatus(this.statusCode);
  }

  /** The diagnostic, or '' when the API sent nothing (rather than the literal 'null'). */
  get message(): string {
    return (this.statusMessage ?? '').toString().trim();
  }

  get labelKey(): string {
    return LABEL_KEYS[this.code] ?? 'status.unknown';
  }
}
