import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { agentRequest, completeCrawlerCreateRequested, configRequest, experimentRequest, proxyRequest, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectAgentsPagination } from 'src/app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { MatDialog } from '@angular/material/dialog';
import { ConfigCreateComponent } from 'src/app/config/component/config-create/config-create.component';
import { AgentCreateComponent } from 'src/app/agent/component/agent-create/agent-create.component';
import { ProxyCreateComponent } from 'src/app/proxy/component/proxy-create/proxy-create.component';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';
import { agentList, configList, experimentList, proxyList } from '../../store/crawler.selectors';

@Component({
  selector: 'app-crawler-create',
  templateUrl: './crawler-create.component.html',
  animations: [fadeIn]
})
export class CrawlerCreateComponent implements OnInit, OnDestroy {
  crawlerForm: FormGroup;
  subscriptions = new Subscription();
  formValid$: Observable<boolean>;
  experiments: any;
  proxies: any;
  agents: any;
  configurations: any;
  agentsData: any;
  paginationConfig: PaginatePipeArgs;
  proxyLoader: boolean = true
  configurationLoader = true
  agentLoader: boolean = true
  experimentLoader: boolean = true
  constructor(private store: Store, private formBuilder: FormBuilder, public router: Router, private matDialog: MatDialog) { }

  ngOnInit(): void {
    this.crawlerForm = this.formBuilder.group({
      name: [null, [Validators.required]],
      description: [null, [Validators.maxLength(1024)]],
      agent_id: [null, [Validators.required]],
      experiment_id: [null, [Validators.required]],
      proxy_id: [null, [Validators.required]],
      configuration_id: [null, [Validators.required]],
    });
    this.getProxies();
    this.getAgents();
    this.getExperiment();
    this.getConfig();
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

  saveCrawler(): void {
    if (!this.crawlerForm.valid) {
      return
    }
    this.store.dispatch(completeCrawlerCreateRequested());
  }

  getProxies(setFirstValue?: boolean) {
    this.store.dispatch(proxyRequest())
    this.store.pipe(select(proxyList)).subscribe((proxy) => {
      if (proxy.data?.length) {
        this.proxies = proxy.data;
        this.proxyLoader = false;
        if (setFirstValue) {
          this.crawlerForm.controls['proxy_id']?.setValue(proxy.data[0]?.id)
        }
      }
    })
  }

  getExperiment() {
    this.experimentLoader = true;
    this.store.dispatch(experimentRequest())
    this.store.pipe(select(experimentList)).subscribe((experiment) => {
      if (experiment.data?.length) {
        this.experiments = experiment.data;
        this.experimentLoader = false;
      }
    })
  }

  getConfig(setFirstValue?: boolean) {
    this.configurationLoader = true;

    this.store.dispatch(configRequest())
    this.store.pipe(select(configList)).subscribe((configurations) => {
      if (configurations.data?.length) {
        this.configurations = configurations.data;
        this.configurationLoader = false;
        if (setFirstValue) {
          this.crawlerForm.controls['configuration_id']?.setValue(configurations.data[0]?.id)
        }
      }
    });
  }

  getAgents(setFirstValue?: boolean) {
    this.agentLoader = true;
    this.store.dispatch(agentRequest())
    this.store.pipe(select(agentList)).subscribe((agent) => {
      if (agent.data?.length) {
        this.agents = agent.data;
        this.agentLoader = false;
        if (setFirstValue) {
          this.crawlerForm.controls['agent_id']?.setValue(agent.data[0]?.id)
        }
      }
    })
  }

  proxyPopup(): void {
    const proxyDialog = this.matDialog.open(ProxyCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          this.getProxies(true);
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  agentPopup(): void {
    const agentDialog = this.matDialog.open(AgentCreateComponent, {
      data: { isPopup: true },
      width: '550px',
      hasBackdrop: true
    });
    if (agentDialog) {
      agentDialog.afterClosed().pipe().subscribe(agent => {
        if (agent) {
          this.getAgents(true);
        }
      }, (err) => {
        console.log(err);
      });
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
        configurationDialog.afterClosed().subscribe(configuration => {
          if (configuration) {
            this.getConfig(true);
          }
        }, (err) => {
          console.error(err);
        })
      )
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
