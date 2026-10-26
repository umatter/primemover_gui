import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { NgClass, NgForOf, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Configuration } from '@app/config/model/config';
import { Preference, PreferenceChange } from '@app/config/model/preference';
import {
  CookieMode,
  cookieMode,
  cookieValue,
  isDecisionWeight,
  missingDefaults,
  preferenceError,
  PreferenceKind,
  preferenceKind,
  requiredError,
  USAGE_TYPE_SUGGESTIONS
} from './preference-catalogue';
import { ProfileApiService } from './profile-api.service';

/**
 * One editable preference. `original` is what the API last said, or null for a row the
 * user added and has not saved yet; the row is dirty when it differs from it.
 */
export interface PreferenceRow {
  name: string;
  kind: PreferenceKind;
  value: string;
  active: boolean;
  description: string | null;
  cookieMode: CookieMode;
  original: Preference | null;
}

/**
 * F1 — the bot's Profile: its configuration's preferences (docs/specs/gui-finalisation.md).
 *
 * Edits are collected locally and saved in one `PUT configurations/{id}` carrying only
 * the rows that changed. The API syncs by name and never deletes, so "remove" here is
 * deactivate, and it is labelled that way — a button saying "Delete" that left the row in
 * the database would be the GUI lying about what happened.
 */
@Component({
  selector: 'app-bot-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, NgTemplateOutlet, FormsModule, ReactiveFormsModule, TranslateModule]
})
export class ProfileComponent implements OnChanges, OnDestroy {
  /** The bot's configuration_id; null or undefined for a bot without one. */
  @Input() configurationId: number | null | undefined;

  configuration: Configuration | null = null;
  rows: PreferenceRow[] = [];
  loading = false;
  saving = false;
  /** The API's message for the last failed load or save, shown inline. */
  error: string | null = null;
  /** i18n key for why the last add was refused. */
  addError: string | null = null;

  readonly usageTypeSuggestions = USAGE_TYPE_SUGGESTIONS;
  addForm: FormGroup;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private api: ProfileApiService
  ) {
    this.addForm = this.fb.group({
      name: ['', [Validators.required]],
      value: ['', [Validators.required]]
    });
  }

  ngOnChanges(): void {
    this.configuration = null;
    this.rows = [];
    this.error = null;
    if (!this.hasConfiguration) return;

    this.loading = true;
    this.subscriptions.add(
      this.api.load(this.configurationId as number).subscribe({
        next: (configuration) => this.render(configuration),
        error: (err: HttpErrorResponse) => {
          this.loading = false;
          this.error = this.messageOf(err);
        }
      })
    );
  }

  get hasConfiguration(): boolean {
    return this.configurationId !== null && this.configurationId !== undefined;
  }

  get generalRows(): PreferenceRow[] {
    return this.rows.filter((r) => !isDecisionWeight(r.name));
  }

  get decisionRows(): PreferenceRow[] {
    return this.rows.filter((r) => isDecisionWeight(r.name));
  }

  get missingDefaults(): { name: string; value: string }[] {
    return missingDefaults(this.rows.map((r) => r.name));
  }

  missingDefaultNames(): string {
    return this.missingDefaults.map((d) => d.name).join(', ');
  }

  get dirtyRows(): PreferenceRow[] {
    return this.rows.filter((r) => this.isDirty(r));
  }

  get canSave(): boolean {
    const dirty = this.dirtyRows;
    return !this.saving && dirty.length > 0 && dirty.every((r) => this.rowError(r) === null);
  }

  isDirty(row: PreferenceRow): boolean {
    if (row.original === null) return true;
    return row.value !== row.original.value || row.active !== Boolean(Number(row.original.active));
  }

  /**
   * i18n key for why this row cannot be saved, or null. A switched-off row is checked for
   * emptiness only: switching off a malformed value must stay possible, an empty one is a
   * 500 from the API.
   */
  rowError(row: PreferenceRow): string | null {
    return row.active ? preferenceError(row.kind, row.value) : requiredError(row.value);
  }

  setValue(row: PreferenceRow, value: string): void {
    row.value = value;
  }

  setCookieMode(row: PreferenceRow, mode: CookieMode): void {
    row.cookieMode = mode;
    // Custom keeps whatever is there, so switching to it never throws work away.
    if (mode !== 'custom') row.value = cookieValue(mode);
  }

  toggleActive(row: PreferenceRow): void {
    row.active = !row.active;
  }

  /** Drop an added row that was never saved; saved rows can only be deactivated. */
  discard(row: PreferenceRow): void {
    if (row.original === null) this.rows = this.rows.filter((r) => r !== row);
  }

  addPreference(): void {
    this.addError = null;
    const name = String(this.addForm.value.name ?? '').trim();
    if (!name) {
      this.addForm.markAllAsTouched();
      return;
    }
    if (this.rows.some((r) => r.name === name)) {
      this.addError = 'workspace.profile.error.duplicate';
      return;
    }
    const value = String(this.addForm.value.value ?? '');
    this.addError = requiredError(value);
    if (this.addError) return;
    this.rows = [...this.rows, this.newRow(name, value)];
    this.addForm.reset({ name: '', value: '' });
  }

  addDefaults(): void {
    this.rows = [...this.rows, ...this.missingDefaults.map((d) => this.newRow(d.name, d.value))];
  }

  save(): void {
    if (!this.configuration || !this.canSave) return;

    const changes: PreferenceChange[] = this.dirtyRows.map((r) => ({
      name: r.name,
      value: r.value,
      description: r.description,
      active: r.active
    }));

    this.saving = true;
    this.error = null;
    this.subscriptions.add(
      this.api.savePreferences(this.configuration, changes).subscribe({
        next: (configuration) => this.render(configuration),
        error: (err: HttpErrorResponse) => {
          // The edits stay on screen: a refused save must not cost the user their work.
          this.saving = false;
          this.error = this.messageOf(err);
        }
      })
    );
  }

  trackByName(_: number, row: PreferenceRow): string {
    return row.name;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private render(configuration: Configuration): void {
    this.configuration = configuration;
    this.rows = (configuration.preferences ?? []).map((p) => this.rowFor(p));
    this.loading = false;
    this.saving = false;
  }

  private rowFor(preference: Preference): PreferenceRow {
    const value = preference.value ?? '';
    return {
      name: preference.name,
      kind: preferenceKind(preference.name),
      value,
      active: Boolean(Number(preference.active)),
      description: preference.description ?? null,
      cookieMode: cookieMode(value),
      original: preference
    };
  }

  private newRow(name: string, value: string): PreferenceRow {
    // The designer's convention: a preference's description is its name until someone
    // writes a better one.
    return { ...this.rowFor({ name, value, description: name, active: 1 }), original: null };
  }

  /** The API's own words when it gave any, so a 403 reads as what it is. */
  private messageOf(err: HttpErrorResponse): string {
    const body = err?.error;
    if (body?.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first.length) return first[0];
    }
    // Falls back to a key; the template translates, and a raw API message passes
    // through the pipe unchanged.
    return body?.message || 'workspace.profile.error.generic';
  }
}
