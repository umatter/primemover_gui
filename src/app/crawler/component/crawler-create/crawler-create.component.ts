import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { completeCrawlerCreateRequested, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectAgentsPagination } from 'src/app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { MatDialog } from '@angular/material/dialog';
import { ConfigCreateComponent } from 'src/app/config/component/config-create/config-create.component';
import { AgentCreateComponent } from 'src/app/agent/component/agent-create/agent-create.component';
import { ProxyCreateComponent } from 'src/app/proxy/component/proxy-create/proxy-create.component';
import { AgentService } from '../../../agent/service/agent.service';
import { ConfigService } from '../../../config/service/config.service';
import { ExperimentService } from '../../../experiment/service/experiment.service';
import { ProxyService } from '../../../proxy/service/proxy.service';
import { selectCurrentExperiment } from 'src/app/experiment/store/experiment.selectors';
import { Experiment } from '../../model/experiment';
@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnInit, OnDestroy {
  currentExperiment$: Observable<Experiment | null>;
  crawlerForm: FormGroup;
  subscriptions = new Subscription();
  experiments: any;
  proxies: any;
  agents: any;
  configurations: any;
  paginationConfig: PaginatePipeArgs;
  proxyLoader: boolean = false;
  configurationLoader = false;
  agentLoader: boolean = false;
  experimentLoader: boolean = false;
  agentCtrl = new FormControl('', [Validators.required]);
  proxyCtrl = new FormControl('', [Validators.required]);
  configCtrl = new FormControl('', [Validators.required]);
  experimentCtrl = new FormControl('', [Validators.required]);

  constructor(
    private agent: AgentService,
    private proxy: ProxyService,
    private configuration: ConfigService,
    private experiment: ExperimentService,
    private store: Store,
    private formBuilder: FormBuilder,
    public router: Router,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]]
    });
    this.subscriptions.add(
      this.crawlerForm.valueChanges.pipe(debounceTime(500)).subscribe((formValue: CrawlerFormValues) => {
        this.store.dispatch(
          updateCrawlerCreateValues({
            name: formValue.name,
            description: formValue.description,
            agent_id: formValue.agent_id,
            configuration_id: formValue.configuration_id,
            experiment_id: formValue.experiment_id,
            proxy_id: formValue.proxy_id
          })
        );
      })
    );
    this.controlChangesDetection();

    this.currentExperiment$.subscribe((currentExperiment) => {
      if (currentExperiment) {
        this.crawlerForm.controls['experiment_id']?.setValue(currentExperiment.id);
        this.experimentCtrl.setValue(currentExperiment.name);
      }
    });
  }

  controlChangesDetection() {
    this.agentCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search?.length >= 2) {
        this.agentLoader = true;
        this.agent.search(search).subscribe(
          (result: any) => {
            this.agents = result.data;
            this.agentLoader = false;
          },
          (error) => {
            this.agentLoader = false;
          }
        );
      }
    });
    this.proxyCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search?.length >= 2) {
        this.proxyLoader = true;
        this.proxy.search(search).subscribe(
          (result: any) => {
            this.proxies = result.data;
            this.proxyLoader = false;
          },
          (error) => {
            this.proxyLoader = false;
          }
        );
      }
    });
    this.configCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search?.length >= 2) {
        this.configurationLoader = true;
        this.configuration.search(search).subscribe(
          (result: any) => {
            this.configurations = result.data;
            this.configurationLoader = false;
          },
          (error) => {
            this.configurationLoader = false;
          }
        );
      }
    });
    this.experimentCtrl.valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe((search) => {
      if (search && search?.length >= 2) {
        this.experimentLoader = true;
        this.experiment.search(search).subscribe(
          (result: any) => {
            this.experiments = result.data;
            this.experimentLoader = false;
          },
          (error) => {
            this.experimentLoader = false;
          }
        );
      }
    });
  }

  setControlValue(item: any, control: any) {
    this.crawlerForm.controls[control]?.setValue(item.id);
  }

  reset(control: any, typeahead: any) {
    this.crawlerForm.controls[control]?.setValue(null);
    typeahead.setValue(null);
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectAgentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  hasValue(controlName: string): boolean {
    return Boolean(this.crawlerForm.get(controlName)?.value);
  }

  hasError(controlName: string, errorName: string): boolean {
    return (
      this.crawlerForm.get(controlName)?.touched &&
      this.crawlerForm.get(controlName)?.invalid &&
      this.crawlerForm.get(controlName)?.getError(errorName)
    );
  }

  autoCompleteHasError(control: string, errorName: string) {
    if (control === 'agentCtrl') {
      return this.agentCtrl?.touched && this.agentCtrl?.invalid && this.agentCtrl.getError(errorName);
    } else if (control === 'proxyCtrl') {
      return this.proxyCtrl?.touched && this.proxyCtrl?.invalid && this.proxyCtrl.getError(errorName);
    } else if (control === 'configCtrl') {
      return this.configCtrl?.touched && this.configCtrl?.invalid && this.configCtrl.getError(errorName);
    } else {
      return this.experimentCtrl?.touched && this.experimentCtrl?.invalid && this.experimentCtrl.getError(errorName);
    }
  }

  saveCrawler(): void {
    if (!this.crawlerForm.valid) {
      return;
    }
    this.store.dispatch(completeCrawlerCreateRequested());
  }

  proxyPopup(): void {
    const proxyDialog = this.matDialog.open(ProxyCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (proxyDialog) {
      proxyDialog
        .afterClosed()
        .pipe()
        .subscribe(
          (proxy) => {
            if (proxy) {
              this.proxyCtrl.setValue(proxy.name);
              this.crawlerForm.controls['proxy_id']?.setValue(proxy.id);
            }
          },
          (err) => {
            console.log(err);
          }
        );
    }
  }

  agentPopup(): void {
    const agentDialog = this.matDialog.open(AgentCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (agentDialog) {
      agentDialog
        .afterClosed()
        .pipe()
        .subscribe(
          (agent) => {
            if (agent) {
              this.agentCtrl.setValue(agent.name);

              this.crawlerForm.controls['agent_id']?.setValue(agent.id);
            }
          },
          (err) => {
            console.log(err);
          }
        );
    }
  }

  configurationPopup(): void {
    const configurationDialog = this.matDialog.open(ConfigCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (configurationDialog) {
      this.subscriptions.add(
        configurationDialog.afterClosed().subscribe(
          (configuration) => {
            if (configuration) {
              this.configCtrl.setValue(configuration.name);
              this.crawlerForm.controls['configuration_id']?.setValue(configuration.id);
            }
          },
          (err) => {
            console.error(err);
          }
        )
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
