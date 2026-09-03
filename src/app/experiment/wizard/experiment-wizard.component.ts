import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { Experiment } from '../model/experiment';
import { Runner } from '../model/runner';
import { ExperimentApiService } from '../service/experiment-api.service';
import { Crawler } from '@app/crawler/model/crawler';
import { Agent } from '@app/agent/model/agent';
import { Proxy } from '@app/proxy/model/proxy';
import { Configuration } from '@app/config/model/config';
import {
  AgentService,
  ConfigurationService,
  CrawlerService,
  ExperimentService,
  ProxyService
} from '@app/entity/service';
import { SharedActions } from '@shared/store/shared.actions';
import { fadeIn } from '@shared/animation/trigger';

/**
 * Guided "new experiment" flow. Hides the crawler/agent/proxy/config plumbing:
 *  1. The study   — creates the Experiment (required).
 *  2. First bot   — optional; under "Advanced" the operator can compose a Crawler
 *                   from existing Library building blocks. Otherwise the bot is
 *                   added from the workspace afterwards.
 *  3. Runs        — informational; scheduled later from the workspace.
 *  4. Review      — confirm and create.
 */
@Component({
  selector: 'app-experiment-wizard',
  templateUrl: './experiment-wizard.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgIf, NgForOf, NgClass, AsyncPipe, RouterLink],
  animations: [fadeIn]
})
export class ExperimentWizardComponent implements OnInit, OnDestroy {
  step = 0;
  readonly stepKeys = ['study', 'bot', 'runs', 'review'];
  submitting = false;
  showAdvanced = false;

  studyForm: FormGroup;
  /** Runner accounts from GET /runners; the study's `runner_user_id` picks one. */
  runners: Runner[] = [];
  botForm: FormGroup;

  agents$: Observable<Agent[]>;
  proxies$: Observable<Proxy[]>;
  configurations$: Observable<Configuration[]>;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService,
    private agentService: AgentService,
    private proxyService: ProxyService,
    private configurationService: ConfigurationService,
    private experimentApi: ExperimentApiService
  ) {
    this.studyForm = this.fb.group({
      name: [null, [Validators.required]],
      contact: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      // Which runner executes the study; preselected with the API's default once loaded.
      runner_user_id: [null]
    });
    this.botForm = this.fb.group({
      name: [null],
      agent_id: [null],
      proxy_id: [null],
      configuration_id: [null]
    });

    this.agents$ = this.agentService.entities$;
    this.proxies$ = this.proxyService.entities$;
    this.configurations$ = this.configurationService.entities$;
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.experimentApi.runners().subscribe((runners) => {
        this.runners = runners;
        const control = this.studyForm.get('runner_user_id');
        if (control && control.value === null) {
          control.setValue(runners.find((r) => r.is_default)?.id ?? null);
        }
      })
    );
    // Load Library building blocks so the (optional) advanced bot selects can populate.
    this.agentService.getAll();
    this.proxyService.getAll();
    this.configurationService.getAll();
  }

  get study() {
    return this.studyForm.controls;
  }

  /** A complete bot can be created inline only when name + all three blocks are chosen. */
  get botIsComplete(): boolean {
    const v = this.botForm.value;
    return !!(v.name && v.agent_id && v.proxy_id && v.configuration_id);
  }

  hasError(controlName: string, errorName: string): boolean {
    const c = this.studyForm.get(controlName);
    return !!(c?.touched && c?.invalid && c?.getError(errorName));
  }

  canAdvance(): boolean {
    if (this.step === 0) return this.studyForm.valid;
    return true;
  }

  next(): void {
    if (this.step === 0 && this.studyForm.invalid) {
      this.studyForm.markAllAsTouched();
      return;
    }
    if (this.step < this.stepKeys.length - 1) this.step += 1;
  }

  back(): void {
    if (this.step > 0) this.step -= 1;
  }

  goTo(index: number): void {
    // Only allow jumping back, or forward when the study is valid.
    if (index <= this.step || this.studyForm.valid) this.step = index;
  }

  cancel(): void {
    this.router.navigate(['/experiments']).then();
  }

  /** Name of the runner chosen in step 1, for the review step. */
  get selectedRunnerName(): string | null {
    const id = this.studyForm.value.runner_user_id;
    return this.runners.find((r) => r.id === id)?.name ?? null;
  }

  create(): void {
    if (this.studyForm.invalid) {
      this.step = 0;
      this.studyForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.subscriptions.add(
      this.experimentService.add(this.studyForm.value).subscribe({
        next: (created: Experiment) => {
          this.store.dispatch(SharedActions.experimentSelection({ experiment: created }));
          if (this.botIsComplete) {
            this.createBot(created);
          } else {
            this.finish(created);
          }
        },
        error: () => (this.submitting = false)
      })
    );
  }

  private createBot(experiment: Experiment): void {
    const payload = {
      name: this.botForm.value.name,
      description: '',
      experiment_id: experiment.id,
      agent_id: this.botForm.value.agent_id,
      proxy_id: this.botForm.value.proxy_id,
      configuration_id: this.botForm.value.configuration_id
    };
    this.subscriptions.add(
      this.crawlerService.add(payload as any).subscribe({
        // Land on the new bot's page so the operator can schedule its first run (Slice B).
        next: (bot: Crawler) => this.finishToBot(experiment, bot),
        // The study exists; land in the workspace even if the bot call fails.
        error: () => this.finish(experiment)
      })
    );
  }

  private finishToBot(experiment: Experiment, bot: Crawler): void {
    this.submitting = false;
    if (bot?.id) {
      this.router.navigate(['experiments', experiment.id, 'bots', bot.id]).then();
    } else {
      this.finish(experiment);
    }
  }

  private finish(experiment: Experiment): void {
    this.submitting = false;
    this.router.navigate(['experiments', experiment.id]).then();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
