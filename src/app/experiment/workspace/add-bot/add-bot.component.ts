import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EntityCollectionServiceBase } from '@ngrx/data';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  Observable,
  startWith,
  Subscription,
  switchMap
} from 'rxjs';

import { Crawler } from '@app/crawler/model/crawler';
import { Agent } from '@app/agent/model/agent';
import { Proxy } from '@app/proxy/model/proxy';
import { Configuration } from '@app/config/model/config';
import { AgentService, ConfigurationService, CrawlerService, ProxyService } from '@app/entity/service';
import { fadeIn } from '@shared/animation/trigger';

/** The three Library blocks a bot is composed from. */
export type LibraryKind = 'agent' | 'proxy' | 'configuration';

const SETUP_FIELDS = ['agent_id', 'proxy_id', 'configuration_id'] as const;
export type SetupField = (typeof SETUP_FIELDS)[number];

/**
 * The setup fields a 422 names. ngrx-data rejects with a DataServiceError whose `error` is the
 * HttpErrorResponse; Laravel's field errors are in that response's body.
 */
export function refusedSetupFields(err: unknown): SetupField[] {
  const e = err as { status?: number; error?: { status?: number; error?: { errors?: object } } } | null;
  const response = typeof e?.status === 'number' ? e : e?.error;
  if (response?.status !== 422) return [];
  const errors = (response as { error?: { errors?: object } }).error?.errors ?? {};
  return SETUP_FIELDS.filter((f) => f in errors);
}

interface LibraryItem {
  id: number;
  name?: string;
  description?: string | null;
}

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

  /**
   * The select options. `getAll()` returns the API's first page only, the newest 15 across
   * all researchers (review on #63), so each select also has a search box, backed by the
   * list's `filter[search]`, and the bot's current items are loaded by id.
   */
  agents$: Observable<Agent[]>;
  proxies$: Observable<Proxy[]>;
  configurations$: Observable<Configuration[]>;

  private readonly searchTerms: Record<LibraryKind, BehaviorSubject<string>> = {
    agent: new BehaviorSubject(''),
    proxy: new BehaviorSubject(''),
    configuration: new BehaviorSubject('')
  };
  /** The ids the API's search returned for a term, per select. */
  private readonly found: Record<LibraryKind, BehaviorSubject<{ term: string; ids: Set<number> }>> = {
    agent: new BehaviorSubject({ term: '', ids: new Set<number>() }),
    proxy: new BehaviorSubject({ term: '', ids: new Set<number>() }),
    configuration: new BehaviorSubject({ term: '', ids: new Set<number>() })
  };

  /** R1.6: setup fields the API refused on the last save (422), e.g. another study's item. */
  refused: Partial<Record<SetupField, true>> = {};

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

    this.agents$ = this.libraryOptions(this.agentService, 'agent', 'agent_id');
    this.proxies$ = this.libraryOptions(this.proxyService, 'proxy', 'proxy_id');
    this.configurations$ = this.libraryOptions(this.configurationService, 'configuration', 'configuration_id');

    // From the caches, not the options: a search that matches nothing is not an empty Library.
    this.librariesReady$ = combineLatest([
      this.agentService.entities$,
      this.proxyService.entities$,
      this.configurationService.entities$
    ]).pipe(map(([agents, proxies, configs]) => agents.length > 0 && proxies.length > 0 && configs.length > 0));
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
    // The bot's own items are rarely among the newest 15; without them the selects show blank.
    const { agent_id, proxy_id, configuration_id } = this.form.value;
    this.loadById(this.agentService, agent_id);
    this.loadById(this.proxyService, proxy_id);
    this.loadById(this.configurationService, configuration_id);
  }

  searchLibrary(kind: LibraryKind, term: string): void {
    this.searchTerms[kind].next(term);
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
    this.refused = {};

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
          error: (err: unknown) => this.failed(err, 'workspace.addBotPanel.editError')
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
        error: (err: unknown) => this.failed(err, 'workspace.addBotPanel.error')
      })
    );
  }

  cancel(): void {
    this.closed.emit();
  }

  private failed(err: unknown, genericKey: string): void {
    this.submitting = false;
    const fields = refusedSetupFields(err);
    this.refused = Object.fromEntries(fields.map((f) => [f, true]));
    this.errorKey = fields.length ? 'workspace.addBotPanel.refusedError' : genericKey;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * One select's options: the cache, newest first, narrowed to a search term. An item stays
   * when its id, name or description contains the term, or when the API's search returned it
   * (that also matches hostname, Multilogin id, location, …), and the selected item always
   * stays, so a search never blanks the select. The API answers with its first page, 15 hits.
   */
  private libraryOptions<T extends LibraryItem>(
    service: EntityCollectionServiceBase<T>,
    kind: LibraryKind,
    controlName: string
  ): Observable<T[]> {
    const term$ = this.searchTerms[kind].pipe(
      map((t) => t.trim()),
      distinctUntilChanged()
    );
    this.subscriptions.add(
      term$
        .pipe(
          debounceTime(250),
          filter((t) => t !== ''),
          switchMap((t) =>
            service.getWithQuery({ ['filter[search]']: t }).pipe(
              map((items) => ({ term: t, ids: new Set(items.map((i) => Number(i.id))) })),
              catchError(() => EMPTY)
            )
          )
        )
        .subscribe((found) => this.found[kind].next(found))
    );

    const control = this.form.get(controlName) as FormControl;
    return combineLatest([
      service.entities$,
      term$,
      this.found[kind],
      control.valueChanges.pipe(startWith(control.value))
    ]).pipe(
      map(([items, term, found, selected]) => {
        const needle = term.toLowerCase();
        const foundIds = found.term === term ? found.ids : new Set<number>();
        return items
          .filter(
            (item) =>
              !needle ||
              Number(item.id) === Number(selected) ||
              // The API matches more than these (hostname, Multilogin id, …): what it found counts.
              foundIds.has(Number(item.id)) ||
              [String(item.id), item.name ?? '', item.description ?? ''].some((f) => f.toLowerCase().includes(needle))
          )
          .sort((a, b) => Number(b.id) - Number(a.id));
      })
    );
  }

  private loadById<T>(service: EntityCollectionServiceBase<T>, id: number | null | undefined): void {
    if (id === null || id === undefined) return;
    // A failed load leaves the select as it was; the id is still saved unchanged.
    this.subscriptions.add(
      service
        .getByKey(id)
        .pipe(catchError(() => EMPTY))
        .subscribe()
    );
  }
}
