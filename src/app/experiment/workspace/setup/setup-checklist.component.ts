import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { Crawler } from '@app/crawler/model/crawler';
import { SetupStepKey, setupSteps } from './setup-steps';

/** What the bot page does when an unmet item's action is clicked. */
export type SetupFix = 'editSetup' | 'treatment' | 'newRun';

interface ChecklistItem {
  key: SetupStepKey | 'runs';
  done: boolean | null;
  /** Null when the item cannot be fixed yet — a treatment lives in a profile. */
  fix: SetupFix | null;
}

const FIX: Record<SetupStepKey, SetupFix> = {
  identity: 'editSetup',
  connection: 'editSetup',
  profile: 'editSetup',
  treatment: 'treatment'
};

/**
 * F4c — the bot's setup checklist (docs/specs/gui-finalisation.md).
 *
 * Complete bots get one quiet line; the full list is only for bots that need something,
 * and every unmet item carries the single action that fixes it. An item the payload
 * cannot answer is shown as unknown — never as a nag, never as a tick.
 */
@Component({
  selector: 'app-setup-checklist',
  templateUrl: './setup-checklist.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, TranslateModule]
})
export class SetupChecklistComponent {
  @Input({ required: true }) bot!: Crawler;
  /** Runs in the list below, or null when the list is filtered and cannot say. */
  @Input() runCount: number | null = null;
  @Output() fix = new EventEmitter<SetupFix>();

  get items(): ChecklistItem[] {
    const all = setupSteps(this.bot);
    const hasProfile = all.find((s) => s.key === 'profile')?.done === true;
    const steps: ChecklistItem[] = all.map((s) => ({
      ...s,
      fix: s.key === 'treatment' && !hasProfile ? null : FIX[s.key]
    }));
    if (this.runCount !== null) steps.push({ key: 'runs', done: this.runCount > 0, fix: 'newRun' });
    return steps;
  }

  get allDone(): boolean {
    return this.items.every((i) => i.done === true);
  }

  get leftCount(): number {
    return this.items.filter((i) => i.done !== true).length;
  }

  stateOf(item: ChecklistItem): string {
    return item.done === null ? 'unknown' : String(item.done);
  }
}
