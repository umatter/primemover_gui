import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Configuration } from '@app/config/model/config';
import { Param } from '@app/config/model/param';
import {
  Arm,
  armOf,
  isControlArm,
  normalizeDomain,
  parseOutletsCsv,
  parseTermsCsv,
  toDraft,
  TreatmentDraft,
  weightErrors
} from './treatment-model';
import { TreatmentApiService } from './treatment-api.service';

export type Weight = 'pi' | 'psi' | 'kappa' | 'tau' | 'alpha' | 'beta';

/**
 * F2 — the bot's Treatment: its configuration's params (docs/specs/gui-finalisation.md).
 *
 * Edits the FIRST params row, because that is the one the runner reads. Saves the whole
 * row in one `PUT params/{id}`; the arm badge previews the unsaved draft, so "Make
 * control" shows its effect before anything is sent.
 */
@Component({
  selector: 'app-bot-treatment',
  templateUrl: './treatment.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, FormsModule, TranslateModule]
})
export class TreatmentComponent implements OnChanges, OnDestroy {
  /** The bot's configuration_id; null or undefined for a bot without one. */
  @Input() configurationId: number | null | undefined;

  configuration: Configuration | null = null;
  /** The row being edited, as last stored. Null when the configuration has none. */
  stored: Param | null = null;
  draft: TreatmentDraft | null = null;

  loading = false;
  saving = false;
  error: string | null = null;

  termsCsv = '';
  outletsCsv = '';
  termsBadLines: number[] = [];
  outletsBadLines: number[] = [];

  readonly weights: Weight[] = ['psi', 'kappa', 'tau', 'alpha', 'beta'];

  private subscriptions = new Subscription();

  constructor(private api: TreatmentApiService) {}

  ngOnChanges(): void {
    this.configuration = null;
    this.stored = null;
    this.draft = null;
    this.error = null;
    if (this.configurationId === null || this.configurationId === undefined) return;

    this.loading = true;
    this.subscriptions.add(
      this.api.load(this.configurationId).subscribe({
        next: (configuration) => {
          this.configuration = configuration;
          this.render(configuration.params?.[0] ?? null);
        },
        error: (err: HttpErrorResponse) => this.fail(err)
      })
    );
  }

  get hasConfiguration(): boolean {
    return this.configurationId !== null && this.configurationId !== undefined;
  }

  get paramId(): number | null {
    return this.stored?.id ?? null;
  }

  /** The arm of what is on screen — the unsaved draft when there is one. */
  get arm(): Arm {
    if (this.draft) return isControlArm(this.draft) ? 'control' : 'treatment';
    return this.configuration ? armOf(this.configuration.params) : 'unknown';
  }

  get rowCount(): number {
    return this.configuration?.params?.length ?? 0;
  }

  get sharedBy(): number {
    return this.configuration?.crawlers_count ?? 0;
  }

  get errors(): Record<string, string> {
    return this.draft ? weightErrors(this.draft) : {};
  }

  get dirty(): boolean {
    if (!this.draft || !this.stored) return false;
    return JSON.stringify(this.normalised(this.draft)) !== JSON.stringify(toDraft(this.stored));
  }

  get canSave(): boolean {
    return !this.saving && this.dirty && Object.keys(this.errors).length === 0;
  }

  setWeight(weight: Weight, value: number | string | null): void {
    if (!this.draft) return;
    this.draft[weight] = value === null || value === '' ? NaN : Number(value);
  }

  /** Control arm: the four weights the runner tests go to 0; alpha, beta, lists stay. */
  applyControlPreset(): void {
    if (!this.draft) return;
    this.draft.pi = 0;
    this.draft.psi = 0;
    this.draft.kappa = 0;
    this.draft.tau = 0;
  }

  addTerm(): void {
    this.draft?.search_terms.push({ term: '', pi: 0 });
  }

  removeTerm(index: number): void {
    this.draft?.search_terms.splice(index, 1);
  }

  addOutlet(): void {
    this.draft?.media_outlet_urls.push({ domain: '', url: null, pi: 0 });
  }

  removeOutlet(index: number): void {
    this.draft?.media_outlet_urls.splice(index, 1);
  }

  /** What an outlet's domain will be saved as, when that differs from what was typed. */
  savedDomain(domain: string): string | null {
    const normalised = normalizeDomain(domain);
    return normalised !== domain.trim() ? normalised : null;
  }

  importTerms(): void {
    if (!this.draft) return;
    const result = parseTermsCsv(this.termsCsv);
    this.draft.search_terms.push(...result.rows);
    this.termsBadLines = result.badLines;
    this.termsCsv = '';
  }

  importOutlets(): void {
    if (!this.draft) return;
    const result = parseOutletsCsv(this.outletsCsv);
    this.draft.media_outlet_urls.push(...result.rows);
    this.outletsBadLines = result.badLines;
    this.outletsCsv = '';
  }

  save(): void {
    if (!this.draft || this.paramId === null || !this.canSave) return;
    this.saving = true;
    this.error = null;
    this.subscriptions.add(
      this.api.save(this.paramId, this.normalised(this.draft)).subscribe({
        next: (param) => this.replaceStored(param),
        error: (err: HttpErrorResponse) => this.fail(err)
      })
    );
  }

  /** A legacy configuration without params gets one, in the control arm. */
  setUp(): void {
    if (!this.configuration) return;
    this.saving = true;
    this.error = null;
    this.subscriptions.add(
      this.api.create(this.configuration.id).subscribe({
        next: (param) => this.replaceStored(param),
        error: (err: HttpErrorResponse) => this.fail(err)
      })
    );
  }

  trackByIndex(index: number): number {
    return index;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private replaceStored(param: Param): void {
    if (this.configuration) {
      const rest = (this.configuration.params ?? []).slice(1);
      this.configuration = { ...this.configuration, params: [param, ...rest] };
    }
    this.render(param);
  }

  private render(param: Param | null): void {
    // A CSV note describes the paste it came from; once the result is stored it is history.
    this.termsBadLines = [];
    this.outletsBadLines = [];
    this.stored = param;
    this.draft = param ? toDraft(param) : null;
    this.loading = false;
    this.saving = false;
  }

  /** The draft as it will be sent: trimmed terms, runner-form outlet domains. */
  private normalised(draft: TreatmentDraft): TreatmentDraft {
    return {
      ...draft,
      search_terms: draft.search_terms.map((t) => ({ term: t.term.trim(), pi: Number(t.pi) })),
      media_outlet_urls: draft.media_outlet_urls.map((o) => ({
        domain: normalizeDomain(o.domain),
        url: o.url?.trim() ? o.url.trim() : null,
        pi: Number(o.pi)
      }))
    };
  }

  private fail(err: HttpErrorResponse): void {
    // Edits stay on screen: a refused save must not cost the user their work.
    this.loading = false;
    this.saving = false;
    const body = err?.error;
    if (body?.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length) {
        this.error = first[0];
        return;
      }
    }
    this.error = body?.message || 'workspace.treatment.error.generic';
  }
}
