import { Component, OnDestroy, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { fadeIn } from '../../../shared/animation/trigger';
import { debounceTime, Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { completeCrawlerCreateRequested, updateCrawlerCreateValues } from '../../store/crawler.actions';
import { CrawlerFormValues } from '../../model/crawler-form-values';
import { selectAgentsPagination } from 'src/app/agent/store/agent.selectors';
import { PaginatePipeArgs } from 'ngx-pagination';
import { MatDialog } from '@angular/material/dialog';
import { ConfigCreateComponent } from 'src/app/config/component/config-create/config-create.component';
import { AgentCreateComponent } from 'src/app/agent/component/agent-create/agent-create.component';
import { ProxyCreateComponent } from 'src/app/proxy/component/proxy-create/proxy-create.component';
import { ExperimentCreateComponent } from 'src/app/experiment/component/experiment-create/experiment-create.component';
import { ProxyService } from '../../../proxy/service/proxy.service';
import { AgentService } from '../../../agent/service/agent.service'
import { ExperimentService } from '../../../experiment/service/experiment.service'
import { ConfigService } from '../../../config/service/config.service';

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
  configuration: any;
  agentsData: any;
  paginationConfig: PaginatePipeArgs;
  constructor(private proxyService: ProxyService,


    private agentService: AgentService,
    private configService: ConfigService,
    private experimentService: ExperimentService,

    private store: Store, private formBuilder: FormBuilder, public router: Router, private matDialog: MatDialog) { }

  ngOnInit(): void {
    // this.formValid$ = this.store.pipe(select(selectCrawlerFormValid));
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
            valid: this.crawlerForm.valid,
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
    console.log('ww')
    this.store.dispatch(completeCrawlerCreateRequested());
  }


  getProxies() {
    this.proxyService.proxies().subscribe((proxy: any) => {
      this.proxies = proxy?.data;
    })
  }


  getExperiment() {
    this.experimentService.list().subscribe((experiment: any) => {
      this.experiments = experiment?.data;
    })
  }

  getConfig() {
    this.configService.list().subscribe((config: any) => {
      this.configuration = config?.data;
    })
  }

  getAgents() {
    this.agentService.agentList().subscribe((agent: any) => {
      this.agents = agent?.data;
    })
  }
  /**
   * @methodName expirementPopup
   * @description set Experiment popup data
   * @parameters none
   * @return none
   */
  expirementPopup(): void {
    const proxyDialog = this.matDialog.open(ExperimentCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          const { data } = proxy;
          if (data.id) {
            // this.proxies.push(data)
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  /**
   * @methodName proxyPopup
   * @description set proxy popup data
   * @parameters none
   * @return none
   */
  proxyPopup(): void {
    const proxyDialog = this.matDialog.open(ProxyCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true,
    });
    if (proxyDialog) {
      proxyDialog.afterClosed().pipe().subscribe(proxy => {
        if (proxy) {
          const { data } = proxy;
          if (data.id) {
            // this.proxies.push(data)
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }

  /**
   * @methodName agentPopup
   * @description set agent popup data
   * @parameters none
   * @return void
   */
  agentPopup(): void {
    const agentDialog = this.matDialog.open(AgentCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true
    });
    if (agentDialog) {
      agentDialog.afterClosed().pipe().subscribe(agent => {
        if (agent) {
          const { data } = agent;
          if (data.id) {
            // this.agents.push(data);
          }
        }
      }, (err) => {
        console.log(err);
      });
    }
  }


  /**
   * @methodName configurationPopup
   * @description open configuration Popup
   * @parameters none
   * @return void
   */
  configurationPopup(): void {
    const configurationDialog = this.matDialog.open(ConfigCreateComponent, {
      data: {},
      width: '550px',
      hasBackdrop: true
    });
    if (configurationDialog) {
      this.subscriptions.add(
        configurationDialog.afterClosed().subscribe(configuration => {
          if (configuration) {
            const { data } = configuration;
            if (data.id) {
              // this.configurations.push(data);
            }
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
