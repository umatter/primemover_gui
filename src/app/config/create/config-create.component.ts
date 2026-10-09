import { Component, OnDestroy } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Configuration } from '@app/config/model/config';
import { ConfigurationService } from '@app/entity/service';

/**
 * F6 — create a profile (docs/specs/gui-finalisation.md).
 *
 * Name and description only: a profile's preferences and its treatment are edited on the
 * page of a bot that uses it (F1/F2). The API starts it in the control arm (#85). The old
 * route rendered a copy of the agent form whose Save went nowhere.
 */
@Component({
  selector: 'app-config-create',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, RouterLink, TranslateModule],
  templateUrl: './config-create.component.html'
})
export class ConfigCreateComponent implements OnDestroy {
  form: FormGroup;
  saving = false;
  error = false;
  created: Configuration | null = null;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['']
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = false;
    const { name, description } = this.form.value;
    this.subscriptions.add(
      this.configurationService
        .add({
          name: String(name).trim(),
          description: String(description ?? '').trim(),
          active: 1
        } as unknown as Configuration)
        .subscribe({
          next: (configuration) => {
            this.saving = false;
            this.created = configuration;
          },
          error: () => {
            this.saving = false;
            this.error = true;
          }
        })
    );
  }

  another(): void {
    this.created = null;
    this.form.reset({ name: '', description: '' });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
