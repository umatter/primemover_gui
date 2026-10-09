import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map, Observable, Subscription } from 'rxjs';

import { Crawler } from '@app/crawler/model/crawler';
import { Agent } from '@app/agent/model/agent';
import { Proxy } from '@app/proxy/model/proxy';
import { Configuration } from '@app/config/model/config';
import { AgentService, ConfigurationService, CrawlerService, ProxyService } from '@app/entity/service';
import { fadeIn } from '@shared/animation/trigger';

/**
 * Slice A — workspace-native "Add bot" panel (docs/specs/runs-and-bots.md §5).
 *
 * Composes a Bot (Crawler) from Library building blocks (agent / proxy / configuration)
 * and POSTs it scoped to the current experiment. Emits `created` on success so the
 * workspace can react; emits `closed` when dismissed. Raw entity IDs are demoted behind
 * plain-language labels; an empty Library block links to its create surface (RA path).
 */
@Component({
  selector: 'app-add-bot',
  templateUrl: './add-bot.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, NgIf, NgForOf, AsyncPipe, RouterLink],
  animations: [fadeIn]
})
export class AddBotComponent implements OnInit, OnDestroy {
  @Input({ required: true }) experimentId!: number;
  /**
   * F4c: set to edit this bot's setup instead of adding one. The bot page's checklist
   * points here when an identity, connection or profile is missing — there was no other
   * place in the GUI to change them after creation.
   */
  @Input() bot: Crawler | null = null;
  @Output() created = new EventEmitter<Crawler>();
  @Output() saved = new EventEmitter<Crawler>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  submitting = false;
  errorKey: string | null = null;

  agents$: Observable<Agent[]> = this.agentService.entities$;
  proxies$: Observable<Proxy[]> = this.proxyService.entities$;
  configurations$: Observable<Configuration[]> = this.configurationService.entities$;

  /** True once every required Library category has at least one entry to pick from. */
  librariesReady$: Observable<boolean>;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private crawlerService: CrawlerService,
    private agentService: AgentService,
    private proxyService: ProxyService,
    private configurationService: ConfigurationService
  ) {
    this.form = this.fb.group({
      name: [null, [Validators.required]],
      description: [''],
      agent_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]]
    });

    this.librariesReady$ = combineLatest([this.agents$, this.proxies$, this.configurations$]).pipe(
      map(([agents, proxies, configs]) => agents.length > 0 && proxies.length > 0 && configs.length > 0)
    );
  }

  get editing(): boolean {
    return this.bot !== null;
  }

  ngOnInit(): void {
    if (this.bot) {
      this.form.patchValue({
        name: this.bot.name,
        description: this.bot.description ?? '',
        agent_id: this.bot.agent_id ?? this.bot.agent?.id ?? null,
        proxy_id: this.bot.proxy_id ?? this.bot.proxy?.id ?? null,
        configuration_id: this.bot.configuration_id ?? this.bot.configuration?.id ?? null
      });
    }
    // Load Library building blocks so the selects can populate.
    this.agentService.getAll();
    this.proxyService.getAll();
    this.configurationService.getAll();
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

    const payload = {
      ...this.form.value,
      experiment_id: this.experimentId
    };

    if (this.bot) {
      this.subscriptions.add(
        this.crawlerService.update({ id: this.bot.id, ...payload } as unknown as Crawler).subscribe({
          next: (bot: Crawler) => {
            this.submitting = false;
            this.saved.emit(bot);
          },
          error: () => {
            this.submitting = false;
            this.errorKey = 'workspace.addBotPanel.editError';
          }
        })
      );
      return;
    }

    this.subscriptions.add(
      this.crawlerService.add(payload as unknown as Crawler).subscribe({
        next: (bot: Crawler) => {
          this.submitting = false;
          this.created.emit(bot);
        },
        error: () => {
          this.submitting = false;
          this.errorKey = 'workspace.addBotPanel.error';
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
