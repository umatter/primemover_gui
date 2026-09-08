import { Component, Input } from '@angular/core';
import { normalizeStatus, QueueStatusEnum } from '@app/queue/status/status.enum';
import { StatusMessageComponent } from '@app/queue/status/status-message.component';
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
 * (`[showMessage]="true"`) and, since messages run to 1800 characters, through
 * {@link StatusMessageComponent}: first clause always visible, the rest behind a keyboard
 * disclosure, with a copy control and a link out of any `previous job <id>` reference.
 */
@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  imports: [NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, TranslateModule, StatusMessageComponent],
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

  /** True when the diagnostic is rendered as text rather than only as a tooltip. */
  get messageVisible(): boolean {
    return this.showMessage && !!this.message;
  }

  /**
   * What the pill's `aria-label` appends to the translated state.
   *
   * When the message is on screen as real text the pill announces the **state only**: the
   * text beside it is now readable, focusable content — it carries a link and two controls
   * — so repeating it here would read the same 1800 characters twice, and `aria-hidden`
   * (the previous arrangement) is not an option once that content is focusable. When the
   * message is *not* rendered — narrow rows pass `showMessage=false` — the pill keeps
   * carrying it, because otherwise it would be unreachable to a screen reader altogether,
   * which is where this component started.
   */
  get ariaMessageSuffix(): string {
    if (this.messageVisible || !this.message) return '';
    return ` — ${this.message}`;
  }

  /** Tailwind colour for the message's first clause: the pill's own severity. */
  get messageToneClass(): string {
    switch (this.code) {
      case QueueStatusEnum.FAILURE:
        return 'text-danger';
      case QueueStatusEnum.WARNING:
        return 'text-warning';
      default:
        return 'text-muted';
    }
  }
}
