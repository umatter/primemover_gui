import { Component, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { fadeIn } from '@shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { selectAgentsPagination } from '@app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Experiment } from '../model/experiment';
import {
  AgentService,
  ConfigurationService,
  CrawlerService,
  ExperimentService,
  ProxyService
} from '@app/entity/service';
import { Agent } from '@app/agent/model/agent';
import { Configuration } from '@app/config/model/config';
import { Proxy } from '@app/proxy/model/proxy';
import { selectCurrentExperiment } from '@shared/store/shared.selectors';

@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnDestroy {
  agentModal: boolean;
  configurationModal: boolean;
  proxyModal: boolean;
  showExperimentAutocompletion: boolean;
  showAgentAutocompletion: boolean;
  showConfigAutocompletion: boolean;
  showProxyAutocompletion: boolean;

  crawlerForm: FormGroup;
  subscriptions = new Subscription();

  filteredExperiments$: Observable<Experiment[]>;
  filteredAgents$: Observable<Agent[]>;
  filteredProxies$: Observable<Proxy[]>;
  filteredConfigurations$: Observable<Configuration[]>;
  paginationConfig: PaginatePipeArgs;

  agentAutocompletion = new FormControl('', [Validators.required]);
  proxyAutocompletion = new FormControl('', [Validators.required]);
  configAutocompletion = new FormControl('', [Validators.required]);
  experimentAutocompletion = new FormControl('', [Validators.required]);

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private experimentEntityService: ExperimentService,
    private agentEntityService: AgentService,
    private configurationEntityService: ConfigurationService,
    private proxyEntityService: ProxyService,
    private crawlerEntityService: CrawlerService
  ) {
    this.filteredExperiments$ = experimentEntityService.filteredEntities$;
    this.filteredAgents$ = agentEntityService.filteredEntities$;
    this.filteredConfigurations$ = configurationEntityService.filteredEntities$;
    this.filteredProxies$ = proxyEntityService.filteredEntities$;

    this.initEntityForm();
    this.initExperimentAutocompletion();
    this.initAgentAutocompletion();
    this.initConfigAutocompletion();
    this.initProxyAutocompletion();
  }

  get experimentId(): UntypedFormControl {
    return this.crawlerForm.get('experiment_id') as FormControl;
  }

  get configurationId(): UntypedFormControl {
    return this.crawlerForm.get('configuration_id') as FormControl;
  }

  get proxyId(): UntypedFormControl {
    return this.crawlerForm.get('proxy_id') as FormControl;
  }

  get agentId(): UntypedFormControl {
    return this.crawlerForm.get('agent_id') as FormControl;
  }

  initEntityForm(): void {
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]]
    });

    this.subscriptions.add(
      this.store.pipe(select(selectCurrentExperiment)).subscribe((currentExperiment) => {
        if (currentExperiment) {
          this.experimentId.setValue(currentExperiment.id);
          this.experimentAutocompletion.setValue(currentExperiment.name);
          this.experimentAutocompletion.disable();
        }
      })
    );
  }

  initExperimentAutocompletion(): void {
    this.experimentEntityService.getAll();
    this.subscriptions.add(
      this.experimentAutocompletion.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((search) => {
        this.showExperimentAutocompletion = true;
        this.experimentEntityService.setFilter(search);
        this.experimentAutocompletion.setValue(search);
      })
    );
  }

  initAgentAutocompletion(): void {
    this.agentEntityService.getAll();
    this.subscriptions.add(
      this.agentAutocompletion.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((search) => {
        this.showAgentAutocompletion = true;
        this.agentEntityService.setFilter(search);
        this.agentAutocompletion.setValue(search);
      })
    );
  }

  initConfigAutocompletion(): void {
    this.configurationEntityService.getAll();
    this.subscriptions.add(
      this.configAutocompletion.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((search) => {
        this.showConfigAutocompletion = true;
        this.configurationEntityService.setFilter(search);
        this.configAutocompletion.setValue(search);
      })
    );
  }

  initProxyAutocompletion(): void {
    this.proxyEntityService.getAll();
    this.subscriptions.add(
      this.proxyAutocompletion.valueChanges.pipe(distinctUntilChanged(), debounceTime(100)).subscribe((search) => {
        this.proxyEntityService.setFilter(search);
        this.proxyAutocompletion.setValue(search);
        this.showProxyAutocompletion = true;
      })
    );
  }

  setControlValue(item: any, control: any) {
    this.crawlerForm.controls[control]?.setValue(item.id);
  }

  reset(control: any, typeahead: FormControl) {
    this.crawlerForm.controls[control]?.setValue(null);
    typeahead.setValue(null);
    typeahead.enable();
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectAgentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.crawlerForm.get(controlName)?.touched &&
      this.crawlerForm.get(controlName)?.invalid &&
      this.crawlerForm.get(controlName)?.getError(errorName)
    );
  }

  // Proxy
  onProxyModalSave(response: Proxy): void {
    this.proxyModal = false;
    this.proxyEntityService.add(response).pipe().subscribe(this.setProxy.bind(this));
  }

  onProxyModalCancel(): void {
    this.proxyModal = false;
  }

  setProxy(proxy: Proxy): void {
    console.log(proxy);
    this.proxyAutocompletion.setValue(proxy.name);
    this.proxyId.setValue(proxy.id);
  }

  // Agent
  onAgentModalSave(response: Agent): void {
    this.agentModal = false;
    this.agentEntityService.add(response).pipe().subscribe(this.setAgent.bind(this));
  }

  onAgentModalCancel(): void {
    this.agentModal = false;
  }

  setAgent(agent: Agent): void {
    this.agentAutocompletion.setValue(agent.name);
    this.agentId.setValue(agent.id);
  }

  // Configuration
  onConfigurationModalSave(response: Configuration): void {
    this.configurationModal = false;
    this.configurationEntityService.add(response).pipe().subscribe(this.setConfiguration.bind(this));
  }

  onConfigurationModalCancel(): void {
    this.configurationModal = false;
  }

  setConfiguration(configuration: Configuration): void {
    this.configAutocompletion.setValue(configuration.name);
    this.configurationId.setValue(configuration.id);
  }

  setExperiment(experiment: Experiment): void {
    this.experimentId.setValue(experiment.id);
    this.experimentAutocompletion.setValue(experiment.name);
    this.experimentAutocompletion.disable();
  }

  onSave(): void {
    this.crawlerEntityService
      .add(this.crawlerForm.value)
      .pipe()
      .subscribe(() => this.resetForms());
  }

  resetForms(): void {
    this.initEntityForm();
    this.experimentAutocompletion.enable();
    this.experimentAutocompletion.setValue(null);
    this.agentAutocompletion.setValue(null);
    this.configAutocompletion.setValue(null);
    this.proxyAutocompletion.setValue(null);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
